import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormField, Input } from '../ui/FormField';
import { useNotification } from '../ui/NotificationSystem';
import { EnhancedProofMintService } from '../../services/EnhancedProofMintService';
import { ReceiptFormData } from '../../types/proofmint';
import { ethers } from 'ethers';

interface IssueReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  provider?: ethers.BrowserProvider;
  onSuccess?: (receiptId: bigint) => void;
}

export const IssueReceiptModal: React.FC<IssueReceiptModalProps> = ({
  isOpen,
  onClose,
  userAddress,
  provider,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ReceiptFormData>({
    buyer: '',
    ipfsHash: '',
    productDescription: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!provider) {
      addNotification({
        type: 'error',
        title: 'No Provider',
        message: 'Please connect your wallet'
      });
      return;
    }

    // Validate form
    const validationErrors = EnhancedProofMintService.validateReceiptForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: validationErrors.join(', ')
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors([]);

      const result = await EnhancedProofMintService.issueReceipt(
        formData,
        provider
      );

      if (result.success && result.data) {
        addNotification({
          type: 'success',
          title: 'Receipt Issued',
          message: `Receipt #${result.data.toString().slice(-6)} created successfully!`,
          duration: 6000
        });
        
        // Reset form
        setFormData({
          buyer: '',
          ipfsHash: '',
          productDescription: '',
          notes: ''
        });
        
        onSuccess?.(result.data);
        onClose();
      } else {
        addNotification({
          type: 'error',
          title: 'Issue Failed',
          message: result.error || 'Failed to issue receipt'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Transaction Error',
        message: 'Failed to issue receipt'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ReceiptFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle>Issue New Receipt</CardTitle>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField 
                  label="Buyer Address" 
                  required
                  error={errors.find(e => e.includes('buyer')) ? 'Invalid buyer address' : undefined}
                >
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={formData.buyer}
                    onChange={(e) => handleInputChange('buyer', e.target.value)}
                    error={!!errors.find(e => e.includes('buyer'))}
                    required
                  />
                </FormField>

                <FormField 
                  label="IPFS Hash" 
                  required
                  hint="Hash of the receipt data stored on IPFS"
                  error={errors.find(e => e.includes('IPFS')) ? 'Invalid IPFS hash' : undefined}
                >
                  <Input
                    type="text"
                    placeholder="QmXxXxXx... or ipfs://..."
                    value={formData.ipfsHash}
                    onChange={(e) => handleInputChange('ipfsHash', e.target.value)}
                    error={!!errors.find(e => e.includes('IPFS'))}
                    required
                  />
                </FormField>

                <FormField 
                  label="Product Description" 
                  hint="Brief description of the purchased item"
                >
                  <Input
                    type="text"
                    placeholder="e.g., iPhone 15 Pro, MacBook Air..."
                    value={formData.productDescription || ''}
                    onChange={(e) => handleInputChange('productDescription', e.target.value)}
                  />
                </FormField>

                <FormField 
                  label="Notes" 
                  hint="Additional notes or comments"
                >
                  <Input
                    type="text"
                    placeholder="Optional notes..."
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </FormField>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    loadingText="Issuing..."
                    icon={<Receipt className="w-4 h-4" />}
                  >
                    Issue Receipt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};