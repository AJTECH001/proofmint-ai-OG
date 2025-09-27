import React, { useState, useEffect } from 'react';
import { zeroGStorageService, StorageLayer } from '../../services/ZeroGStorageService';
import ZeroGStorageUploader from './ZeroGStorageUploader';
import ZeroGStorageDownloader from './ZeroGStorageDownloader';
import ZeroGStorageManagementDashboard from './ZeroGStorageManagementDashboard';
import { 
  Database, 
  FileText, 
  Activity, 
  Server, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Info,
  Settings,
  BarChart3
} from 'lucide-react';

interface HealthStatus {
  healthy: boolean;
  details: {
    rpcUrl: string;
    indexerUrl: string;
    kvNodeUrl: string;
    blockNumber: number;
    walletConfigured: boolean;
    uploadsEnabled: boolean;
    timestamp: string;
    error?: string;
  };
}

interface NodeInfo {
  nodeId: string;
  endpoint: string;
  capacity: number;
  available: boolean;
}

export const ZeroGStorageDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'download' | 'status' | 'nodes'>('upload');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [storageLayers, setStorageLayers] = useState<StorageLayer[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<NodeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadHealthStatus = async () => {
    setIsLoading(true);
    try {
      const health = await zeroGStorageService.healthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Failed to load health status:', error);
      setHealthStatus({
        healthy: false,
        details: {
          rpcUrl: '',
          indexerUrl: '',
          kvNodeUrl: '',
          blockNumber: 0,
          walletConfigured: false,
          uploadsEnabled: false,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Health check failed'
        }
      });
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  const loadStorageLayers = async () => {
    try {
      const response = await zeroGStorageService.getStorageLayers();
      if (response.success) {
        setStorageLayers(response.layers);
      }
    } catch (error) {
      console.error('Failed to load storage layers:', error);
    }
  };

  const loadSelectedNodes = async () => {
    try {
      const response = await zeroGStorageService.selectStorageNodes();
      if (response.success) {
        setSelectedNodes(response.nodes);
      }
    } catch (error) {
      console.error('Failed to load selected nodes:', error);
    }
  };

  useEffect(() => {
    loadHealthStatus();
    loadStorageLayers();
  }, []);

  useEffect(() => {
    if (activeTab === 'nodes') {
      loadSelectedNodes();
    }
  }, [activeTab]);

  const getHealthStatusIcon = () => {
    if (!healthStatus) return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    
    if (healthStatus.healthy) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getHealthStatusColor = () => {
    if (!healthStatus) return 'text-gray-500';
    return healthStatus.healthy ? 'text-green-500' : 'text-red-500';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'upload', label: 'Upload Files', icon: FileText },
    { id: 'download', label: 'Download Files', icon: Database },
    { id: 'management', label: 'Storage Management', icon: Settings },
    { id: 'status', label: 'System Status', icon: Activity },
    { id: 'nodes', label: 'Storage Nodes', icon: Server }
  ] as const;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">0G Storage Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Decentralized storage with 95% lower costs than AWS S3
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getHealthStatusIcon()}
            <span className={`text-sm font-medium ${getHealthStatusColor()}`}>
              {healthStatus?.healthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
          
          <button
            onClick={loadHealthStatus}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Storage Layers</p>
              <p className="text-2xl font-bold text-gray-900">{storageLayers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <Server className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Nodes</p>
              <p className="text-2xl font-bold text-gray-900">{selectedNodes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Block Height</p>
              <p className="text-2xl font-bold text-gray-900">
                {healthStatus?.details.blockNumber || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className={`w-8 h-8 ${healthStatus?.details.uploadsEnabled ? 'text-green-500' : 'text-red-500'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upload Status</p>
              <p className={`text-lg font-bold ${healthStatus?.details.uploadsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {healthStatus?.details.uploadsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {activeTab === 'upload' && (
          <div className="p-6">
            <ZeroGStorageUploader
              onUploadComplete={(result) => {
                console.log('Upload completed:', result);
              }}
              onBatchUploadComplete={(result) => {
                console.log('Batch upload completed:', result);
              }}
            />
          </div>
        )}

        {activeTab === 'download' && (
          <div className="p-6">
            <ZeroGStorageDownloader
              onDownloadComplete={(filename, data) => {
                console.log('Download completed:', filename, data);
              }}
            />
          </div>
        )}

        {activeTab === 'management' && (
          <div className="p-6">
            <ZeroGStorageManagementDashboard />
          </div>
        )}

        {activeTab === 'status' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              {healthStatus ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    healthStatus.healthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {getHealthStatusIcon()}
                      <span className={`font-medium ${getHealthStatusColor()}`}>
                        {healthStatus.healthy ? 'All systems operational' : 'System issues detected'}
                      </span>
                    </div>
                    {healthStatus.details.error && (
                      <p className="text-sm text-red-600 mt-2">{healthStatus.details.error}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">RPC URL:</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {healthStatus.details.rpcUrl}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Indexer URL:</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {healthStatus.details.indexerUrl}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">KV Node URL:</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {healthStatus.details.kvNodeUrl}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Wallet Configured:</span>
                          <span className={healthStatus.details.walletConfigured ? 'text-green-600' : 'text-red-600'}>
                            {healthStatus.details.walletConfigured ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Uploads Enabled:</span>
                          <span className={healthStatus.details.uploadsEnabled ? 'text-green-600' : 'text-red-600'}>
                            {healthStatus.details.uploadsEnabled ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Storage Layers</h4>
                      <div className="space-y-2">
                        {storageLayers.map((layer) => (
                          <div key={layer.type} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              {layer.type === 'log' ? (
                                <Database className="w-5 h-5 text-blue-500" />
                              ) : (
                                <FileText className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 capitalize">
                                {layer.type === 'log' ? 'Log Layer' : 'Key-Value Layer'}
                              </h5>
                              <p className="text-sm text-gray-600">{layer.description}</p>
                              <p className="text-xs text-gray-500 mt-1">Use case: {layer.useCase}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Loading health status...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Storage Nodes</h3>
              <button
                onClick={loadSelectedNodes}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Nodes</span>
              </button>
            </div>

            {selectedNodes.length > 0 ? (
              <div className="space-y-4">
                {selectedNodes.map((node, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Server className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">Node {index + 1}</p>
                          <p className="text-sm text-gray-600 font-mono">{node.endpoint}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Capacity</p>
                          <p className="font-medium">{formatBytes(node.capacity)}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          node.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {node.available ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No nodes available</p>
                <button
                  onClick={loadSelectedNodes}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default ZeroGStorageDashboard;
