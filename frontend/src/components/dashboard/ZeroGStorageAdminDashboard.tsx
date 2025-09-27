import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { 
  Database, FileText, Server, Activity, CheckCircle, XCircle, AlertTriangle, 
  Upload, Download, Settings, Users, TrendingUp, Shield, Eye, Plus,
  RefreshCw, BarChart3, PieChart, Clock, HardDrive, Zap, Globe, X
} from 'lucide-react';
import { zeroGStorageService } from '../../services/ZeroGStorageService';

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
}

interface NodeInfo {
  nodeId: string;
  endpoint: string;
  capacity: number;
  available: boolean;
  uptime: string;
  lastCheck: string;
}

interface RecentActivity {
  type: 'upload' | 'download' | 'node_join' | 'node_leave' | 'error';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  hash?: string;
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
}

export default function ZeroGStorageAdminDashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    totalFiles: 1247,
    totalSize: '2.4TB',
    activeNodes: 89,
    networkHealth: 98.5,
    monthlyGrowth: 12.5,
    storageUsed: '24%',
    avgResponseTime: '1.2s',
    successRate: 99.8
  });
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeForm, setNewNodeForm] = useState({
    endpoint: '',
    capacity: '',
    description: ''
  });

  // Demo data - replace with real API calls
  useEffect(() => {
    loadDashboardData();
    
    // Set up demo data
    setNodes([
      {
        nodeId: 'node-001',
        endpoint: 'https://node1.0g.ai',
        capacity: 8192,
        available: true,
        uptime: '99.8%',
        lastCheck: '2 mins ago'
      },
      {
        nodeId: 'node-002', 
        endpoint: 'https://node2.0g.ai',
        capacity: 4096,
        available: true,
        uptime: '99.5%',
        lastCheck: '1 min ago'
      },
      {
        nodeId: 'node-003',
        endpoint: 'https://node3.0g.ai', 
        capacity: 2048,
        available: false,
        uptime: '97.2%',
        lastCheck: '5 mins ago'
      }
    ]);

    setRecentActivity([
      { type: 'upload', description: 'Large dataset uploaded', timestamp: '2024-01-15 14:30', status: 'success', hash: '0x1234...5678' },
      { type: 'download', description: 'File retrieved successfully', timestamp: '2024-01-15 13:45', status: 'success', hash: '0xabcd...efgh' },
      { type: 'node_join', description: 'New storage node joined network', timestamp: '2024-01-15 12:20', status: 'success' },
      { type: 'error', description: 'Node 003 temporarily unavailable', timestamp: '2024-01-15 11:15', status: 'error' },
      { type: 'upload', description: 'Batch upload completed', timestamp: '2024-01-15 10:30', status: 'success', hash: '0x9876...1234' }
    ]);

    setFiles([
      {
        id: 'file-001',
        name: 'receipt_data_2024.json',
        size: 15728640,
        type: 'application/json',
        rootHash: '0x1234567890abcdef',
        uploadedAt: '2024-01-15 14:30',
        txHash: '0xabcd1234567890ef',
        status: 'active'
      },
      {
        id: 'file-002',
        name: 'ai_training_dataset.zip',
        size: 1073741824,
        type: 'application/zip',
        rootHash: '0x9876543210fedcba',
        uploadedAt: '2024-01-15 13:45',
        txHash: '0xefgh5678901234cd',
        status: 'active'
      },
      {
        id: 'file-003',
        name: 'document.pdf',
        size: 5242880,
        type: 'application/pdf',
        rootHash: '0xfedcba0987654321',
        uploadedAt: '2024-01-15 12:20',
        txHash: '0xijkl9012345678ab',
        status: 'processing'
      }
    ]);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load health status
      const health = await zeroGStorageService.healthCheck();
      setHealthStatus(health);
      
      // Load storage layers
      const layers = await zeroGStorageService.getStorageLayers();
      console.log('Storage layers:', layers);
      
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-4 h-4 text-blue-600" />;
      case 'download':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'node_join':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'node_leave':
        return <X className="w-4 h-4 text-red-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const TabButton = ({ id, label, isActive, onClick }: {
    id: string;
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

  const NodeModal = ({ node, isOpen, onClose }: {
    node: NodeInfo | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen || !node) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Node {node.nodeId}</h3>
                <p className="text-gray-600">Storage Node Details & Management</p>
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(node.available ? 'active' : 'error')}`}>
                      {node.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Endpoint:</span>
                    <span className="font-mono text-sm">{node.endpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{formatBytes(node.capacity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{node.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Check:</span>
                    <span className="text-sm">{node.lastCheck}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span className="font-medium">142ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage Used:</span>
                      <span className="font-medium">68%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Connections:</span>
                      <span className="font-medium">247</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {!node.available && (
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Restart Node
                </button>
              )}
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                <Eye className="w-4 h-4 mr-2" />
                View Logs
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
            <h2 className="text-2xl font-bold text-gray-900">0G Storage Admin</h2>
            <p className="text-gray-600">Decentralized storage network management</p>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-blue-600">
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Network Administrator</span>
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
            id="overview"
            label="📊 Overview"
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            id="nodes"
            label="🖥️ Storage Nodes"
            isActive={activeTab === 'nodes'}
            onClick={() => setActiveTab('nodes')}
          />
          <TabButton
            id="files"
            label="📁 Files"
            isActive={activeTab === 'files'}
            onClick={() => setActiveTab('files')}
          />
          <TabButton
            id="analytics"
            label="📈 Analytics"
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          <TabButton
            id="system"
            label="⚙️ System Health"
            isActive={activeTab === 'system'}
            onClick={() => setActiveTab('system')}
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

          {/* Growth Metrics */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Network Growth</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">+{storageStats.monthlyGrowth}%</div>
                <div className="text-sm text-gray-600">Monthly Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{storageStats.storageUsed}</div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{storageStats.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{storageStats.avgResponseTime}</div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Network Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{activity.description}</div>
                      <div className="text-xs text-gray-500">{activity.timestamp}</div>
                    </div>
                    {activity.hash && (
                      <div className="text-sm text-gray-600 font-mono">{activity.hash}</div>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${getStatusColor(activity.status)}`}>
                    {activity.status}
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
            <button 
              onClick={() => setShowAddNodeModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
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
                      <div className="text-xs text-gray-500">Capacity: {formatBytes(node.capacity)}</div>
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
                    <Clock className="w-3 h-3 mr-1" />
                    Last check: {node.lastCheck}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedNode(node)}
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

      {activeTab === 'files' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Stored Files</h3>
          
          <div className="space-y-4">
            {files.map(file => (
              <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-4">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-600">{formatBytes(file.size)} • {file.type}</div>
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
                    <Database className="w-3 h-3 mr-1" />
                    Stored on 0G Network
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
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

          {/* Storage Distribution */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Storage Distribution</h3>
            <div className="space-y-4">
              {[
                { category: 'Receipt Data', size: '1.2TB', percentage: 50, files: 647 },
                { category: 'AI Training Data', size: '800GB', percentage: 33, files: 423 },
                { category: 'Documents', size: '400GB', percentage: 17, files: 177 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-900">{item.category}</div>
                      <div className="text-sm text-gray-600">{item.files} files</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{item.size}</div>
                    <div className="text-sm text-gray-600">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Performance */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Network Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[
                  { metric: 'Average Upload Time', value: '2.3s', trend: '+0.1s' },
                  { metric: 'Average Download Time', value: '1.2s', trend: '-0.2s' },
                  { metric: 'Network Latency', value: '142ms', trend: '-5ms' },
                  { metric: 'Success Rate', value: '99.8%', trend: '+0.1%' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-gray-900">{item.metric}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{item.value}</div>
                      <div className="text-xs text-green-600">{item.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-gray-500">Performance chart would go here</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">System Health Monitor</h3>
            <div className="space-y-4">
              {[
                { component: '0G Storage Network', status: 'healthy', uptime: '99.8%', lastCheck: '1 min ago' },
                { component: 'Indexer Service', status: 'healthy', uptime: '99.9%', lastCheck: '30 secs ago' },
                { component: 'KV Storage', status: 'healthy', uptime: '99.7%', lastCheck: '2 mins ago' },
                { component: 'Node Discovery', status: 'warning', uptime: '97.5%', lastCheck: '5 mins ago' },
                { component: 'Filecoin Integration', status: 'healthy', uptime: '99.9%', lastCheck: '1 min ago' }
              ].map((component, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      component.status === 'healthy' ? 'bg-green-500' : 
                      component.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{component.component}</div>
                      <div className="text-sm text-gray-600">Uptime: {component.uptime}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded ${getStatusColor(component.status)}`}>
                      {component.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{component.lastCheck}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Configuration</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>RPC Endpoint</span>
                    <span>Connected</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Indexer Service</span>
                    <span>Active</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">API Response Time</span>
                  <span className="font-medium">142ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Latency</span>
                  <span className="font-medium">2.3s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Rate</span>
                  <span className="font-medium">0.02%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Connections</span>
                  <span className="font-medium">1,247</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Modal */}
      <NodeModal
        node={selectedNode}
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Storage Node</h3>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Endpoint *
                </label>
                <input
                  type="text"
                  value={newNodeForm.endpoint}
                  onChange={(e) => setNewNodeForm(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://node.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Capacity (GB)
                </label>
                <input
                  type="number"
                  value={newNodeForm.capacity}
                  onChange={(e) => setNewNodeForm(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="8192"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newNodeForm.description}
                  onChange={(e) => setNewNodeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Node description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddNodeModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add node logic here
                    setShowAddNodeModal(false);
                  }}
                  disabled={!newNodeForm.endpoint}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Node
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
