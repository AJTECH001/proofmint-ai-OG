import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { checkNetworkHealth, validateContractAddress, parseContractError } from '../../utils/contractErrorHandler';
import { AlertTriangle, CheckCircle, WifiOff, RefreshCw, Info } from 'lucide-react';

interface NetworkStatus {
  isHealthy: boolean;
  chainId?: number;
  blockNumber?: number;
  error?: string;
}

interface ContractStatus {
  isValid: boolean;
  exists: boolean;
  error?: string;
}

export const NetworkDiagnostics: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ isHealthy: false });
  const [contractStatus, setContractStatus] = useState<ContractStatus>({ isValid: false, exists: false });
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const ZG_TESTNET_ID = 16601;
  const CONTRACT_ADDRESS = '0x045962833e855095DbE8B061d0e7E929a3f5C55c'; // Example contract address

  const runDiagnostics = async () => {
    setIsChecking(true);
    
    try {
      // Check network health
      const networkHealth = await checkNetworkHealth();
      setNetworkStatus(networkHealth);
      
      // Check contract status
      const contractValidation = await validateContractAddress(CONTRACT_ADDRESS);
      setContractStatus(contractValidation);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Diagnostics failed:', error);
      const parsedError = parseContractError(error);
      setNetworkStatus({
        isHealthy: false,
        error: parsedError.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [chainId, isConnected]);

  const getStatusIcon = (isHealthy: boolean, isLoading = false) => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  const isCorrectNetwork = chainId === ZG_TESTNET_ID;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-600" />
          Network Diagnostics
        </h3>
        <button
          onClick={runDiagnostics}
          disabled={isChecking}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Wallet Connection */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {getStatusIcon(isConnected)}
            <span className="ml-3 font-medium">Wallet Connection</span>
          </div>
          <div className="text-sm text-gray-600">
            {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not connected'}
          </div>
        </div>

        {/* Network Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {getStatusIcon(isCorrectNetwork)}
            <span className="ml-3 font-medium">Network</span>
          </div>
          <div className="text-sm text-gray-600">
            {isCorrectNetwork ? '0G Testnet' : `Chain ID: ${chainId} (Expected: ${ZG_TESTNET_ID})`}
          </div>
        </div>

        {/* RPC Health */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {getStatusIcon(networkStatus.isHealthy, isChecking)}
            <span className="ml-3 font-medium">RPC Connection</span>
          </div>
          <div className="text-sm text-gray-600">
            {networkStatus.isHealthy ? (
              `Block: ${networkStatus.blockNumber}`
            ) : (
              networkStatus.error || 'Connection failed'
            )}
          </div>
        </div>

        {/* Contract Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {getStatusIcon(contractStatus.exists, isChecking)}
            <span className="ml-3 font-medium">Smart Contract</span>
          </div>
          <div className="text-sm text-gray-600">
            {contractStatus.exists ? 'Contract found' : (contractStatus.error || 'Contract not found')}
          </div>
        </div>

        {/* 0G Storage Configuration */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {getStatusIcon(!!import.meta.env.VITE_ZERO_G_INDEXER_URL)}
            <span className="ml-3 font-medium">0G Storage Config</span>
          </div>
          <div className="text-sm text-gray-600">
            {import.meta.env.VITE_ZERO_G_INDEXER_URL ? 'Configured' : 'Not configured'}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {lastUpdated && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Error Details */}
      {!networkStatus.isHealthy && networkStatus.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <WifiOff className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-red-800">Connection Issue</h4>
              <p className="text-sm text-red-700 mt-1">{networkStatus.error}</p>
              <div className="mt-3 text-sm text-red-600">
                <p className="font-medium">Troubleshooting steps:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Verify you're connected to 0G Testnet</li>
                  <li>Try refreshing the page</li>
                  <li>Check if MetaMask is unlocked</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Switch Help */}
      {isConnected && !isCorrectNetwork && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-yellow-800">Wrong Network</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please switch to 0G Testnet (Chain ID: {ZG_TESTNET_ID}) to use this application.
              </p>
              <div className="mt-3">
                <details className="text-sm text-yellow-600">
                  <summary className="cursor-pointer font-medium">0G Testnet Details</summary>
                  <div className="mt-2 space-y-1 font-mono text-xs">
                    <p>Network Name: 0G Testnet</p>
                    <p>RPC URL: https://evmrpc-testnet.0g.ai</p>
                    <p>Chain ID: 16601</p>
                    <p>Currency: OG</p>
                    <p>Explorer: https://chainscan-galileo.0g.ai</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};