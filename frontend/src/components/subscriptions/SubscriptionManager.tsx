import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Building, Star, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { LoadingOverlay } from '../ui/LoadingSpinner';
import { useNotification } from '../ui/NotificationSystem';
import { EnhancedProofMintService } from '../../services/EnhancedProofMintService';
import { 
  SubscriptionTier, 
  Subscription, 
  SubscriptionFormData,
  SubscriptionPricing 
} from '../../types/proofmint';
import { ethers } from 'ethers';

interface SubscriptionManagerProps {
  userAddress: string;
  provider?: ethers.BrowserProvider;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  userAddress,
  provider
}) => {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [pricing, setPricing] = useState<SubscriptionPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(SubscriptionTier.BASIC);
  
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState<SubscriptionFormData>({
    tier: SubscriptionTier.BASIC,
    duration: 1,
    paymentMethod: 'ETH'
  });

  useEffect(() => {
    loadSubscriptionData();
  }, [userAddress]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subscriptionResult] = await Promise.all([
        EnhancedProofMintService.getSubscription(userAddress)
      ]);

      if (subscriptionResult.success && subscriptionResult.data) {
        setCurrentSubscription(subscriptionResult.data);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSubscription = async () => {
    if (!provider) {
      addNotification({
        type: 'error',
        title: 'No Provider',
        message: 'Please connect your wallet'
      });
      return;
    }

    const errors = EnhancedProofMintService.validateSubscriptionForm(formData);
    if (errors.length > 0) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: errors.join(', ')
      });
      return;
    }

    try {
      setPurchasing(true);
      const result = await EnhancedProofMintService.purchaseSubscription(
        formData,
        provider,
        userAddress
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Subscription Purchased',
          message: `Successfully purchased ${SubscriptionTier[formData.tier]} subscription`,
          duration: 6000
        });
        setShowPurchaseModal(false);
        await loadSubscriptionData();
      } else {
        addNotification({
          type: 'error',
          title: 'Purchase Failed',
          message: result.error || 'Failed to purchase subscription'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Transaction Error',
        message: 'Failed to complete subscription purchase'
      });
    } finally {
      setPurchasing(false);
    }
  };

  const tiers = [
    {
      id: SubscriptionTier.BASIC,
      name: 'Basic',
      icon: Star,
      color: 'blue',
      price: '0.01',
      priceUSDC: '10',
      receiptLimit: '100',
      features: [
        'Up to 100 receipts/month',
        'Basic analytics',
        'Email support',
        'Standard features'
      ]
    },
    {
      id: SubscriptionTier.PREMIUM,
      name: 'Premium',
      icon: Crown,
      color: 'purple',
      price: '0.05',
      priceUSDC: '50',
      receiptLimit: '1,000',
      features: [
        'Up to 1,000 receipts/month',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'API access'
      ]
    },
    {
      id: SubscriptionTier.ENTERPRISE,
      name: 'Enterprise',
      icon: Building,
      color: 'emerald',
      price: '0.1',
      priceUSDC: '100',
      receiptLimit: 'Unlimited',
      features: [
        'Unlimited receipts',
        'Enterprise analytics',
        'Dedicated support',
        'White-label options',
        'Custom contracts',
        'SLA guarantee'
      ]
    }
  ];

  const formatExpiryDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const isExpiringSoon = (expiresAt: bigint) => {
    const expiry = new Date(Number(expiresAt) * 1000);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 7;
  };

  return (
    <LoadingOverlay isLoading={loading} text="Loading subscription data...">
      <div className="space-y-6">
        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tier</p>
                  <p className="font-semibold capitalize">
                    {SubscriptionTier[currentSubscription.tier]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expires</p>
                  <p className={`font-semibold ${
                    isExpiringSoon(currentSubscription.expiresAt) ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                    {formatExpiryDate(currentSubscription.expiresAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Receipts Remaining</p>
                  <p className="font-semibold">
                    {currentSubscription.receiptsRemaining.toString()}
                  </p>
                </div>
              </div>

              {isExpiringSoon(currentSubscription.expiresAt) && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-orange-700">
                    Your subscription expires soon. Renew to avoid service interruption.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Subscription Tiers */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrentTier = currentSubscription?.tier === tier.id;
              
              return (
                <motion.div
                  key={tier.id}
                  whileHover={{ y: -4 }}
                  className={`relative ${isCurrentTier ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <Card 
                    padding="lg" 
                    shadow="md" 
                    className={`h-full ${isCurrentTier ? 'border-blue-500' : ''}`}
                  >
                    {isCurrentTier && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Current Plan
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`inline-flex p-3 rounded-full bg-${tier.color}-100 mb-4`}>
                        <Icon className={`w-6 h-6 text-${tier.color}-600`} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                      
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">{tier.price} ETH</span>
                        <span className="text-gray-500 text-sm">/month</span>
                        <p className="text-sm text-gray-500 mt-1">
                          or ${tier.priceUSDC} USDC
                        </p>
                      </div>

                      <p className="text-sm text-gray-600 mb-6">
                        {tier.receiptLimit} receipts per month
                      </p>

                      <ul className="space-y-3 mb-8">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Zap className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button
                        fullWidth
                        variant={isCurrentTier ? 'outline' : 'primary'}
                        disabled={isCurrentTier}
                        onClick={() => {
                          setSelectedTier(tier.id);
                          setFormData(prev => ({ ...prev, tier: tier.id }));
                          setShowPurchaseModal(true);
                        }}
                      >
                        {isCurrentTier ? 'Current Plan' : 'Choose Plan'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Purchase Modal */}
        <AnimatePresence>
          {showPurchaseModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPurchaseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Purchase {SubscriptionTier[selectedTier]} Plan
                  </h3>
                  <p className="text-gray-600">
                    Complete your subscription purchase
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField label="Duration (months)" required>
                    <Select
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        duration: parseInt(e.target.value) 
                      }))}
                    >
                      {[1, 3, 6, 12].map(months => (
                        <option key={months} value={months}>
                          {months} month{months > 1 ? 's' : ''}
                          {months === 12 && ' (10% discount)'}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Payment Method" required>
                    <Select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        paymentMethod: e.target.value as 'ETH' | 'USDC'
                      }))}
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                    </Select>
                  </FormField>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Cost:</span>
                      <span className="font-semibold">
                        {formData.paymentMethod === 'ETH' 
                          ? `${(parseFloat(tiers.find(t => t.id === selectedTier)?.price || '0') * formData.duration).toFixed(3)} ETH`
                          : `${parseInt(tiers.find(t => t.id === selectedTier)?.priceUSDC || '0') * formData.duration} USDC`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => setShowPurchaseModal(false)}
                      disabled={purchasing}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      isLoading={purchasing}
                      loadingText="Processing..."
                      onClick={handlePurchaseSubscription}
                      icon={<CreditCard className="w-4 h-4" />}
                    >
                      Purchase
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LoadingOverlay>
  );
};