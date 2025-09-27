import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Database, Server, Activity, CheckCircle, XCircle, 
  Upload, Download, Settings, TrendingUp, Shield, Eye,
  RefreshCw, BarChart3, PieChart, HardDrive, Globe,
  Archive, Search, SortAsc, SortDesc, Key, Plus, Layers
} from 'lucide-react';
import { zeroGStorageService, StorageLayer } from '../../services/ZeroGStorageService';
import ZeroGStorageUploader from './ZeroGStorageUploader';
import ZeroGStorageDownloader from './ZeroGStorageDownloader';

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

interface StorageStats {
  totalFiles: number;
  totalSize: string;
  activeNodes: number;
  networkHealth: number;
  monthlyGrowth: number;
  storageUsed: string;
  avgResponseTime: string;
  successRate: number;
  logLayerFiles: number;
  kvLayerEntries: number;
}

interface NodeInfo {
  nodeId: string;
  endpoint: string;
  capacity: number;
  available: boolean;
  uptime: string;
  lastCheck: string;
  region: string;
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  rootHash: string;
  uploadedAt: string;
  txHash: string;
  status: 'active' | 'processing' | 'error';
  layer: 'log' | 'kv';
  replicas: number;
}

export default function ZeroGStorageManagementDashboard() {
  const { } = useAccount();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [storageStats] = useState<StorageStats>({
    totalFiles: 1247,
    totalSize: '2.4TB',
    activeNodes: 89,
    networkHealth: 98.5,
    monthlyGrowth: 12.5,
    storageUsed: '24%',
    avgResponseTime: '1.2s',
    successRate: 99.8,
    logLayerFiles: 892,
    kvLayerEntries: 355
  });
  const [storageLayers, setStorageLayers] = useState<StorageLayer[]>([]);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLayer, setFilterLayer] = useState<'all' | 'log' | 'kv'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadDashboardData();
    loadDemoData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load health status
      const health = await zeroGStorageService.healthCheck();
      setHealthStatus(health);
      
      // Load storage layers
      const layers = await zeroGStorageService.getStorageLayers();
      if (layers.success) {
        setStorageLayers(layers.layers);
      }
      
      // Load node selection
      const nodeSelection = await zeroGStorageService.selectStorageNodes();
      if (nodeSelection.success) {
        console.log('Available nodes:', nodeSelection.nodes);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = () => {
    // Demo nodes data
    setNodes([
      {
        nodeId: 'node-001',
        endpoint: 'https://node1.0g.ai',
        capacity: 8192,
        available: true,
        uptime: '99.8%',
        lastCheck: '2 mins ago',
        region: 'US West'
      },
      {
        nodeId: 'node-002', 
        endpoint: 'https://node2.0g.ai',
        capacity: 4096,
        available: true,
        uptime: '99.5%',
        lastCheck: '1 min ago',
        region: 'EU Central'
      },
      {
        nodeId: 'node-003',
        endpoint: 'https://node3.0g.ai', 
        capacity: 2048,
        available: false,
        uptime: '97.2%',
        lastCheck: '5 mins ago',
        region: 'Asia Pacific'
      }
    ]);

    // Demo files data
    setFiles([
      {
        id: 'file-001',
        name: 'receipt_data_2024.json',
        size: 15728640,
        type: 'application/json',
        rootHash: '0x1234567890abcdef',
        uploadedAt: '2024-01-15 14:30',
        txHash: '0xabcd1234567890ef',
        status: 'active',
        layer: 'log',
        replicas: 3
      },
      {
        id: 'file-002',
        name: 'ai_training_dataset.zip',
        size: 1073741824,
        type: 'application/zip',
        rootHash: '0x9876543210fedcba',
        uploadedAt: '2024-01-15 13:45',
        txHash: '0xefgh5678901234cd',
        status: 'active',
        layer: 'log',
        replicas: 5
      },
      {
        id: 'file-003',
        name: 'user_profiles.kv',
        size: 5242880,
        type: 'application/octet-stream',
        rootHash: '0xfedcba0987654321',
        uploadedAt: '2024-01-15 12:20',
        txHash: '0xijkl9012345678ab',
        status: 'active',
        layer: 'kv',
        replicas: 3
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLayer = filterLayer === 'all' || file.layer === filterLayer;
      return matchesSearch && matchesLayer;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const TabButton = ({ label, isActive, onClick }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  const FileModal = ({ file, isOpen, onClose }: {
    file: FileInfo | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen || !file) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{file.name}</h3>
                <p className="text-gray-600">File Details & Management</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(file.status)}`}>
                      {file.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage Layer:</span>
                    <span className="font-medium capitalize">{file.layer === 'log' ? 'Log Layer' : 'Key-Value Layer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{formatBytes(file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{file.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Replicas:</span>
                    <span className="font-medium">{file.replicas}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Root Hash:</span>
                    <span className="font-mono text-sm">{file.rootHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction:</span>
                    <span className="font-mono text-sm">{file.txHash.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uploaded:</span>
                    <span className="font-medium">{file.uploadedAt}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🔗 Blockchain Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Network:</span>
                      <span className="font-medium">0G Chain</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Storage:</span>
                      <span className="font-medium">Decentralized</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Verification:</span>
                      <span className="font-medium">PoRA Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowDownloadModal(true);
                  onClose();
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">0G Storage Management</h2>
            <p className="text-gray-600">Complete decentralized storage solution</p>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-blue-600">
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Storage Administrator</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {healthStatus?.healthy ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                healthStatus?.healthy ? 'text-green-500' : 'text-red-500'
              }`}>
                {healthStatus?.healthy ? 'Network Healthy' : 'Network Issues'}
              </span>
            </div>
            
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-1">
        <div className="flex space-x-1">
          <TabButton
            label="📊 Overview"
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            label="💾 Storage Layers"
            isActive={activeTab === 'storage'}
            onClick={() => setActiveTab('storage')}
          />
          <TabButton
            label="📁 File Management"
            isActive={activeTab === 'files'}
            onClick={() => setActiveTab('files')}
          />
          <TabButton
            label="🖥️ Storage Nodes"
            isActive={activeTab === 'nodes'}
            onClick={() => setActiveTab('nodes')}
          />
          <TabButton
            label="📈 Analytics"
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Storage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{storageStats.totalFiles.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Files</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HardDrive className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{storageStats.totalSize}</div>
                  <div className="text-sm text-gray-600">Total Storage</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Server className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{storageStats.activeNodes}</div>
                  <div className="text-sm text-gray-600">Active Nodes</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{storageStats.networkHealth}%</div>
                  <div className="text-sm text-gray-600">Network Health</div>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Layers Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ Storage Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Archive className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Log Layer (Immutable)</h4>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-2">{storageStats.logLayerFiles}</div>
                <div className="text-sm text-gray-600">Files stored permanently</div>
                <div className="text-xs text-gray-500 mt-1">Perfect for AI training data, archives, backups</div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Key className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Key-Value Layer (Mutable)</h4>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-2">{storageStats.kvLayerEntries}</div>
                <div className="text-sm text-gray-600">Key-value entries</div>
                <div className="text-xs text-gray-500 mt-1">Perfect for databases, dynamic content, state storage</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center justify-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Upload className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-blue-900">Upload Files</span>
              </button>
              
              <button
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center justify-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Download className="w-6 h-6 text-green-600" />
                <span className="font-medium text-green-900">Download Files</span>
              </button>
              
              <button
                onClick={() => setActiveTab('nodes')}
                className="flex items-center justify-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Server className="w-6 h-6 text-purple-600" />
                <span className="font-medium text-purple-900">Manage Nodes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Layers */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Storage Layers Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {storageLayers.map((layer) => (
                <div
                  key={layer.type}
                  className={`p-6 border-2 rounded-lg ${
                    layer.type === 'log' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center mb-4">
                    {layer.type === 'log' ? (
                      <Archive className="w-8 h-8 text-blue-600 mr-3" />
                    ) : (
                      <Key className="w-8 h-8 text-green-600 mr-3" />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {layer.type === 'log' ? 'Log Layer' : 'Key-Value Layer'}
                      </h4>
                      <p className="text-sm text-gray-600">{layer.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Use Case:</span>
                      <span className="text-gray-900">{layer.useCase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900">
                        {layer.type === 'log' ? 'Immutable Storage' : 'Mutable Storage'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Files:</span>
                      <span className="text-gray-900">
                        {layer.type === 'log' ? storageStats.logLayerFiles : storageStats.kvLayerEntries}
                      </span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 py-2 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors">
                    Configure Layer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Layer Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Log Layer Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Upload Speed:</span>
                  <span className="font-medium">2.3s avg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Download Speed:</span>
                  <span className="font-medium">1.2s avg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">95% cheaper than AWS</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Key-Value Layer Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Read Latency:</span>
                  <span className="font-medium">142ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Write Latency:</span>
                  <span className="font-medium">245ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Throughput:</span>
                  <span className="font-medium">10K ops/sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className="font-medium">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-6">
          {/* File Management Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">File Management</h3>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterLayer}
                  onChange={(e) => setFilterLayer(e.target.value as 'all' | 'log' | 'kv')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Layers</option>
                  <option value="log">Log Layer</option>
                  <option value="kv">Key-Value Layer</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Files List */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {filteredFiles.map(file => (
                <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-4 ${
                        file.layer === 'log' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {file.layer === 'log' ? (
                          <Archive className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Key className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatBytes(file.size)} • {file.type} • {file.replicas} replicas
                        </div>
                        <div className="text-xs text-gray-500 font-mono">Hash: {file.rootHash}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded mb-1 ${getStatusColor(file.status)}`}>
                        {file.status}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{file.uploadedAt}</div>
                      <div className="text-xs text-gray-600">TX: {file.txHash.slice(0, 10)}...</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Layers className="w-3 h-3 mr-1" />
                      {file.layer === 'log' ? 'Log Layer' : 'Key-Value Layer'}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedFile(file)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm flex items-center">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nodes' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Storage Nodes Management</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Node
            </button>
          </div>
          
          <div className="space-y-4">
            {nodes.map(node => (
              <div key={node.nodeId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-4">
                      <Server className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{node.nodeId}</div>
                      <div className="text-sm text-gray-600">{node.endpoint}</div>
                      <div className="text-xs text-gray-500">
                        Capacity: {formatBytes(node.capacity)} • Region: {node.region}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded mb-1 ${getStatusColor(node.available ? 'active' : 'error')}`}>
                      {node.available ? 'Available' : 'Unavailable'}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{node.uptime}</div>
                    <div className="text-xs text-gray-600">{node.lastCheck}</div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-3 h-3 mr-1" />
                    {node.region}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => console.log('Node details functionality not implemented yet', node)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <div className="text-sm text-gray-600">Files Stored</div>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-2 text-sm text-green-600">↑ 12.5% from last month</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">2.4TB</div>
                  <div className="text-sm text-gray-600">Storage Used</div>
                </div>
                <PieChart className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-2 text-sm text-green-600">↑ 8.3% from last month</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">99.8%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-2 text-sm text-green-600">↑ 0.1% from last month</div>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">0G Storage vs AWS S3</h4>
                <div className="space-y-3">
                  {[
                    { metric: 'Cost', value: '95% cheaper', improvement: '+9500%' },
                    { metric: 'Speed', value: 'Same as S3', improvement: '0%' },
                    { metric: 'Decentralization', value: 'Fully decentralized', improvement: '+∞%' },
                    { metric: 'Censorship Resistance', value: '100% resistant', improvement: '+∞%' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{item.metric}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{item.value}</div>
                        <div className="text-xs text-green-600">{item.improvement}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
                  <div className="text-gray-600">Cost Savings</div>
                  <div className="text-sm text-gray-500 mt-2">Compared to AWS S3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Modal */}
      <FileModal
        file={selectedFile}
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Upload Files to 0G Storage</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              <ZeroGStorageUploader
                onUploadComplete={(result) => {
                  console.log('Upload completed:', result);
                  setShowUploadModal(false);
                }}
                onBatchUploadComplete={(result) => {
                  console.log('Batch upload completed:', result);
                  setShowUploadModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Download from 0G Storage</h3>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              <ZeroGStorageDownloader
                onDownloadComplete={(filename, data) => {
                  console.log('Download completed:', filename, data);
                  setShowDownloadModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
