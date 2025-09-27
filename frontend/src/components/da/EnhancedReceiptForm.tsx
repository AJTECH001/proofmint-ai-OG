import React, { useState } from 'react';
import { useZeroGDA, useReceiptDA } from '../../contexts/ZeroGDAContext';
import { enhancedProofMintService, EnhancedReceipt, ReceiptCreationOptions } from '../../services/EnhancedProofMintService';
import { FaUpload, FaDatabase, FaShieldAlt, FaCoins, FaInfoCircle } from 'react-icons/fa';

interface EnhancedReceiptFormProps {
  onReceiptCreated?: (receipt: { success: boolean; tokenId?: number; commitment?: string }) => void;
  onClose?: () => void;
}

const EnhancedReceiptForm: React.FC<EnhancedReceiptFormProps> = ({
  onReceiptCreated,
  onClose
}) => {
  const { isConnected, canSubmitData } = useZeroGDA();
  const { estimateCost } = useReceiptDA();
  
  const [formData, setFormData] = useState<Partial<EnhancedReceipt>>({
    deviceInfo: {
      type: '',
      brand: '',
      model: '',
      serialNumber: ''
    },
    purchaseInfo: {
      date: new Date().toISOString().split('T')[0],
      price: 0,
      currency: 'USD',
      merchant: '',
      location: ''
    },
    warranties: {
      duration: '1 year',
      terms: 'manufacturer',
      provider: '',
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    sustainability: {
      recyclingProgram: false,
      carbonOffset: '',
      ecoRating: ''
    },
    attachments: {
      images: [],
      documents: [],
      certificates: []
    }
  });

  const [options, setOptions] = useState<ReceiptCreationOptions>({
    useDA: true,
    includeFallback: true,
    enableRichData: true,
    compressionLevel: 'standard'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>('');
  const [costEstimate, setCostEstimate] = useState<{ cost: string; gasEstimate: number } | null>(null);

  // Calculate cost estimate when form data changes
  React.useEffect(() => {
    const calculateCost = async () => {
      if (options.useDA && formData.deviceInfo?.brand) {
        const dataSize = new TextEncoder().encode(JSON.stringify(formData)).length;
        const estimate = await estimateCost(dataSize);
        setCostEstimate(estimate);
      }
    };
    
    calculateCost();
  }, [formData, options.useDA, estimateCost]);

  const handleInputChange = (section: keyof EnhancedReceipt, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleOptionsChange = (option: keyof ReceiptCreationOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus('Preparing receipt data...');

    try {
      const result = await enhancedProofMintService.createEnhancedReceipt(formData, options);
      
      if (result.success) {
        setSubmissionStatus('Receipt created successfully! 🎉');
        onReceiptCreated?.(result);
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            deviceInfo: { type: '', brand: '', model: '', serialNumber: '' },
            purchaseInfo: { date: new Date().toISOString().split('T')[0], price: 0, currency: 'USD', merchant: '', location: '' },
            warranties: { duration: '1 year', terms: 'manufacturer', provider: '', expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
            sustainability: { recyclingProgram: false, carbonOffset: '', ecoRating: '' },
            attachments: { images: [], documents: [], certificates: [] }
          });
          setSubmissionStatus('');
        }, 3000);
      } else {
        setSubmissionStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setSubmissionStatus(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUpload className="mr-2 text-blue-600" />
          Create Enhanced NFT Receipt
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* 0G DA Status Indicator */}
      <div className={`mb-6 p-4 rounded-lg border ${
        isConnected 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaDatabase className={`mr-2 ${isConnected ? 'text-green-600' : 'text-yellow-600'}`} />
            <span className={`font-medium ${isConnected ? 'text-green-800' : 'text-yellow-800'}`}>
              0G DA Status: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {costEstimate && options.useDA && (
            <div className="flex items-center text-sm text-gray-600">
              <FaCoins className="mr-1" />
              Estimated cost: {costEstimate.cost} OG
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Storage Options */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FaShieldAlt className="mr-2" />
            Storage Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.useDA}
                onChange={(e) => handleOptionsChange('useDA', e.target.checked)}
                className="mr-2"
                disabled={!canSubmitData}
              />
              <span className="text-sm">
                Use 0G DA for scalable storage
                {!canSubmitData && <span className="text-yellow-600 ml-1">(Node not ready)</span>}
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeFallback}
                onChange={(e) => handleOptionsChange('includeFallback', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Include fallback storage (IPFS)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.enableRichData}
                onChange={(e) => handleOptionsChange('enableRichData', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Enable rich metadata</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compression Level
              </label>
              <select
                value={options.compressionLevel}
                onChange={(e) => handleOptionsChange('compressionLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="none">None</option>
                <option value="standard">Standard</option>
                <option value="maximum">Maximum</option>
              </select>
            </div>
          </div>
        </div>

        {/* Device Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Device Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type *
                </label>
                <select
                  value={formData.deviceInfo?.type || ''}
                  onChange={(e) => handleInputChange('deviceInfo', 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select device type</option>
                  <option value="smartphone">Smartphone</option>
                  <option value="laptop">Laptop</option>
                  <option value="tablet">Tablet</option>
                  <option value="smartwatch">Smartwatch</option>
                  <option value="headphones">Headphones</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand *
                </label>
                <input
                  type="text"
                  value={formData.deviceInfo?.brand || ''}
                  onChange={(e) => handleInputChange('deviceInfo', 'brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.deviceInfo?.model || ''}
                  onChange={(e) => handleInputChange('deviceInfo', 'model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.deviceInfo?.serialNumber || ''}
                  onChange={(e) => handleInputChange('deviceInfo', 'serialNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Purchase Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  value={formData.purchaseInfo?.date || ''}
                  onChange={(e) => handleInputChange('purchaseInfo', 'date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchaseInfo?.price || 0}
                    onChange={(e) => handleInputChange('purchaseInfo', 'price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.purchaseInfo?.currency || 'USD'}
                    onChange={(e) => handleInputChange('purchaseInfo', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant *
                </label>
                <input
                  type="text"
                  value={formData.purchaseInfo?.merchant || ''}
                  onChange={(e) => handleInputChange('purchaseInfo', 'merchant', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.purchaseInfo?.location || ''}
                  onChange={(e) => handleInputChange('purchaseInfo', 'location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sustainability Options */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Sustainability & Environmental Impact</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sustainability?.recyclingProgram || false}
                onChange={(e) => handleInputChange('sustainability', 'recyclingProgram', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Participate in recycling program</span>
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carbon Offset (kg CO2)
                </label>
                <input
                  type="text"
                  value={formData.sustainability?.carbonOffset || ''}
                  onChange={(e) => handleInputChange('sustainability', 'carbonOffset', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5.2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eco Rating
                </label>
                <select
                  value={formData.sustainability?.ecoRating || ''}
                  onChange={(e) => handleInputChange('sustainability', 'ecoRating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select rating</option>
                  <option value="A">A (Excellent)</option>
                  <option value="B">B (Good)</option>
                  <option value="C">C (Average)</option>
                  <option value="D">D (Poor)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Status Display */}
        {submissionStatus && (
          <div className={`p-4 rounded-lg ${
            submissionStatus.includes('Error') || submissionStatus.includes('failed')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : submissionStatus.includes('success')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <FaInfoCircle className="mr-2" />
              {submissionStatus}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || (!canSubmitData && options.useDA)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
              isSubmitting || (!canSubmitData && options.useDA)
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Receipt...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" />
                Create Enhanced Receipt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedReceiptForm;