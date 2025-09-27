import React, { useState } from 'react';
import { useZeroGAI } from '../../contexts/ZeroGAIContext';
import { FaKey, FaCoins, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface ZeroGAISetupProps {
  onSetupComplete?: () => void;
}

const ZeroGAISetup: React.FC<ZeroGAISetupProps> = ({ onSetupComplete }) => {
  const { 
    isInitialized, 
    isLoading, 
    balance, 
    services, 
    error, 
    initializeService, 
    addFunds,
    clearError 
  } = useZeroGAI();

  const [privateKey, setPrivateKey] = useState('');
  const [fundAmount, setFundAmount] = useState('0.1');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [setupStep, setSetupStep] = useState<'key' | 'fund' | 'complete'>('key');

  const handleInitialize = async () => {
    if (!privateKey.trim()) {
      return;
    }

    try {
      await initializeService(privateKey.trim());
      setSetupStep('fund');
    } catch (err) {
      console.error('Setup failed:', err);
    }
  };

  const handleAddFunds = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      return;
    }

    try {
      await addFunds(fundAmount);
      setSetupStep('complete');
      if (onSetupComplete) {
        onSetupComplete();
      }
    } catch (err) {
      console.error('Failed to add funds:', err);
    }
  };

  const handleSkipFunding = () => {
    setSetupStep('complete');
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  if (isInitialized && setupStep === 'complete') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <FaCheckCircle className="text-green-600" />
          <h3 className="font-semibold text-green-800">0G AI Enhanced Chat Ready!</h3>
        </div>
        <div className="text-sm text-green-700 space-y-1">
          <p>✅ Connected to 0G Network</p>
          <p>✅ {services.length} AI models available</p>
          {balance && (
            <p>✅ Balance: {parseFloat(balance.available).toFixed(4)} OG tokens</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <FaInfoCircle className="text-blue-600" />
        <h3 className="font-semibold text-blue-800">Enhanced AI with 0G Network</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {setupStep === 'key' && (
        <div className="space-y-3">
          <p className="text-sm text-blue-700">
            Connect to 0G Network for advanced AI capabilities with verified responses from models like Llama 3.3 70B and DeepSeek R1.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <FaKey className="inline mr-1" />
              Private Key (0G Network)
            </label>
            <div className="relative">
              <input
                type={showPrivateKey ? 'text' : 'password'}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your 0G network private key..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs"
              >
                {showPrivateKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleInitialize}
              disabled={isLoading || !privateKey.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Connecting...' : 'Connect to 0G Network'}
            </button>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <strong>Note:</strong> Your private key is used locally to authenticate with the 0G Network. It's not stored or transmitted to ProofMint servers.
          </div>
        </div>
      )}

      {setupStep === 'fund' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-green-600">
            <FaCheckCircle />
            <span className="text-sm">Connected to 0G Network!</span>
          </div>

          <p className="text-sm text-blue-700">
            Add funds to your account for AI inference requests. Each message costs a small amount of OG tokens.
          </p>

          {balance && (
            <div className="bg-gray-50 p-2 rounded text-sm">
              <div>Available Balance: {parseFloat(balance.available).toFixed(4)} OG</div>
              {parseFloat(balance.available) > 0 && (
                <div className="text-green-600">You already have funds! You can skip this step.</div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <FaCoins className="inline mr-1" />
              Fund Amount (OG tokens)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
            <div className="text-xs text-gray-600">
              0.1 OG ≈ ~10,000 AI messages. Recommended for getting started.
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleAddFunds}
              disabled={isLoading || !fundAmount || parseFloat(fundAmount) <= 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Adding Funds...' : `Add ${fundAmount} OG`}
            </button>
            <button
              onClick={handleSkipFunding}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZeroGAISetup;