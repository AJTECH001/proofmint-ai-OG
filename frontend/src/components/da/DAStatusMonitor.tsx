import React, { useState, useEffect } from 'react';
import { useZeroGDA } from '../../contexts/ZeroGDAContext';
import { FaCircle, FaServer, FaNetworkWired, FaSync, FaCog } from 'react-icons/fa';

interface DAStatusMonitorProps {
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DAStatusMonitor: React.FC<DAStatusMonitorProps> = ({
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const { 
    nodeStatus, 
    isInitialized, 
    isConnected, 
    refreshNodeStatus, 
    isLoading,
    error 
  } = useZeroGDA();

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;

    const interval = setInterval(() => {
      refreshNodeStatus();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isInitialized, refreshNodeStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-500';
      case 'syncing': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isInitialized) return 'Not Initialized';
    if (isLoading) return 'Checking...';
    if (error) return 'Error';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  const handleManualRefresh = async () => {
    await refreshNodeStatus();
    setLastRefresh(new Date());
  };

  if (!showDetails) {
    // Compact view
    return (
      <div className="flex items-center space-x-2">
        <FaCircle className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
        <span className="text-sm text-gray-600">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <FaServer className="mr-2" />
          0G DA Node Status
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isLoading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Refresh status"
          >
            <FaSync className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl mb-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <FaCircle />
          </div>
          <div className="text-sm font-medium text-gray-700">Connection</div>
          <div className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {getStatusText()}
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl mb-1 ${getStatusColor(nodeStatus?.syncStatus || 'disconnected')}`}>
            <FaNetworkWired />
          </div>
          <div className="text-sm font-medium text-gray-700">Sync Status</div>
          <div className={`text-xs ${getStatusColor(nodeStatus?.syncStatus || 'disconnected')}`}>
            {nodeStatus?.syncStatus || 'Unknown'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl mb-1 text-blue-500">
            #{nodeStatus?.blockHeight || 0}
          </div>
          <div className="text-sm font-medium text-gray-700">Block Height</div>
          <div className="text-xs text-gray-500">Latest</div>
        </div>

        <div className="text-center">
          <div className="text-2xl mb-1 text-purple-500">
            {nodeStatus?.peerCount || 0}
          </div>
          <div className="text-sm font-medium text-gray-700">Peers</div>
          <div className="text-xs text-gray-500">Connected</div>
        </div>
      </div>

      {/* Detailed Information */}
      {nodeStatus && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Node Version:</span>
              <span className="ml-2 text-gray-600">{nodeStatus.nodeVersion}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Network ID:</span>
              <span className="ml-2 text-gray-600">{nodeStatus.networkId}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Refresh:</span>
              <span className="ml-2 text-gray-600">
                {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Auto Refresh:</span>
              <span className="ml-2 text-gray-600">
                {autoRefresh ? `Every ${refreshInterval / 1000}s` : 'Off'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Action Items */}
      {!isConnected && !isLoading && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yellow-800">
              0G DA node is not connected. Check your node configuration.
            </div>
            <button
              onClick={() => {/* TODO: Open configuration modal */}}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors flex items-center"
            >
              <FaCog className="mr-1" />
              Configure
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DAStatusMonitor;