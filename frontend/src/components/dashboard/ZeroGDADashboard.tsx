import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { 
  Database, FileText, Server, Activity, CheckCircle, XCircle, AlertTriangle, 
  Upload, Download, Settings, Users, TrendingUp, Shield, Eye, Plus,
  RefreshCw, BarChart3, PieChart, Clock, HardDrive, Zap, Globe, X,
  Layers, Key, Archive, Search, Filter, SortAsc, SortDesc, Timer,
  FileCheck, FileX, Network, Cpu, MemoryStick
} from 'lucide-react';
import { 
  zeroGDAService, 
  DABlobData, 
  DASubmissionResult, 
  DARetrievalResult,
  DANodeStatus,
  DAAnalytics 
} from '../../services/ZeroGDAService';

interface DACommitmentInfo {
  commitment: string;
  blobHash: string;
  dataSize: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'finalized';
  batchId?: string;
  receiptId?: string;
}

interface RecentActivity {
  type: 'submission' | 'retrieval' | 'verification' | 'error';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  commitment?: string;
  details?: string;
}

export default function ZeroGDADashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [nodeStatus, setNodeStatus] = useState<DANodeStatus | null>(null);
  const [analytics, setAnalytics] = useState<DAAnalytics | null>(null);
  const [commitments, setCommitments] = useState<DACommitmentInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<DACommitmentInfo | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'finalized'>('all');

  useEffect(() => {
    loadDashboardData();
    loadDemoData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load health status
      const healthResult = await zeroGDAService.healthCheck();
      if (healthResult.success && healthResult.status) {
        setNodeStatus(healthResult.status);
      }
      
      // Load analytics
      const analyticsResult = await zeroGDAService.getAnalytics();
      if (analyticsResult.success && analyticsResult.analytics) {
        setAnalytics(analyticsResult.analytics);
      }
    } catch (error) {
      console.error('Failed to load DA dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = () => {
    // Demo commitments data
    setCommitments([
      {
        commitment: '0x1234567890abcdef1234567890abcdef12345678',
        blobHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        dataSize: 15728640,
        timestamp: '2024-01-15 14:30',
        status: 'finalized',
        batchId: 'batch_001',
        receiptId: 'receipt_001'
      },
      {
        commitment: '0x9876543210fedcba9876543210fedcba98765432',
        blobHash: '0xfedcba9876543210fedcba9876543210fedcba98',
        dataSize: 8388608,
        timestamp: '2024-01-15 13:45',
        status: 'confirmed',
        batchId: 'batch_002',
        receiptId: 'receipt_002'
      },
      {
        commitment: '0x5555555555555555555555555555555555555555',
        blobHash: '0x6666666666666666666666666666666666666666',
        dataSize: 4194304,
        timestamp: '2024-01-15 12:20',
        status: 'pending',
        batchId: 'batch_003',
        receiptId: 'receipt_003'
      }
    ]);

    // Demo activity data
    setRecentActivity([
      { 
        type: 'submission', 
        description: 'Receipt data submitted to DA', 
        timestamp: '2024-01-15 14:30', 
        status: 'success',
        commitment: '0x1234567890abcdef1234567890abcdef12345678',
        details: 'iPhone 15 Pro receipt data'
      },
      { 
        type: 'retrieval', 
        description: 'Data retrieved from DA', 
        timestamp: '2024-01-15 13:45', 
        status: 'success',
        commitment: '0x9876543210fedcba9876543210fedcba98765432',
        details: 'MacBook Air receipt verification'
      },
      { 
        type: 'verification', 
        description: 'Data availability verified', 
        timestamp: '2024-01-15 13:30', 
        status: 'success',
        commitment: '0x5555555555555555555555555555555555555555',
        details: 'AirPods Pro authenticity check'
      },
      { 
        type: 'error', 
        description: 'DA submission failed', 
        timestamp: '2024-01-15 12:15', 
        status: 'error',
        details: 'Network timeout during submission'
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized':
      case 'success':
      case 'synced':
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'disconnected':
      case 'offline':
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

  const filteredCommitments = commitments.filter(commitment => {
    const matchesSearch = commitment.commitment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commitment.receiptId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || commitment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <Upload className="w-4 h-4 text-blue-600" />;
      case 'retrieval':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'verification':
        return <FileCheck className="w-4 h-4 text-purple-600" />;
      case 'error':
        return <FileX className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
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

  const CommitmentModal = ({ commitment, isOpen, onClose }: {
    commitment: DACommitmentInfo | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen || !commitment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">DA Commitment Details</h3>
                <p className="text-gray-600">Data Availability Commitment Information</p>
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(commitment.status)}`}>
                      {commitment.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Size:</span>
                    <span className="font-medium">{formatBytes(commitment.dataSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Batch ID:</span>
                    <span className="font-medium">{commitment.batchId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt ID:</span>
                    <span className="font-medium">{commitment.receiptId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="font-medium">{commitment.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Commitment Hash:</span>
                    <div className="font-mono text-sm mt-1 bg-gray-50 p-2 rounded break-all">
                      {commitment.commitment}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Blob Hash:</span>
                    <div className="font-mono text-sm mt-1 bg-gray-50 p-2 rounded break-all">
                      {commitment.blobHash}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Retrieve Data
              </button>
              <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                <FileCheck className="w-4 h-4 mr-2" />
                Verify Availability
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
            <h2 className="text-2xl font-bold text-gray-900">0G Data Availability</h2>
            <p className="text-gray-600">Infinitely scalable data availability layer</p>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-blue-600">
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Data Availability Manager</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {nodeStatus?.isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                nodeStatus?.isConnected ? 'text-green-500' : 'text-red-500'
              }`}>
                {nodeStatus?.isConnected ? 'DA Network Online' : 'DA Network Offline'}
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
            id="commitments"
            label="🔗 Commitments"
            isActive={activeTab === 'commitments'}
            onClick={() => setActiveTab('commitments')}
          />
          <TabButton
            id="nodes"
            label="🖥️ DA Nodes"
            isActive={activeTab === 'nodes'}
            onClick={() => setActiveTab('nodes')}
          />
          <TabButton
            id="analytics"
            label="📈 Analytics"
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* DA Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.totalSubmissions.toLocaleString() || '1,247'}
                  </div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.totalRetrievals.toLocaleString() || '3,892'}
                  </div>
                  <div className="text-sm text-gray-600">Total Retrievals</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.successRate || '99.8'}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Timer className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.averageSubmissionTime || '2.3'}s
                  </div>
                  <div className="text-sm text-gray-600">Avg Submission Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Network Health */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Network Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Server className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">DA Client</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeStatus?.isConnected ? 'synced' : 'disconnected')}`}>
                    {nodeStatus?.isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">Block Height:</span>
                  <span className="font-medium">{nodeStatus?.blockHeight || '0'}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Cpu className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Encoder</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeStatus?.encoderStatus || 'offline')}`}>
                    {nodeStatus?.encoderStatus || 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">Peers:</span>
                  <span className="font-medium">{nodeStatus?.peerCount || '0'}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <MemoryStick className="w-6 h-6 text-purple-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Retriever</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeStatus?.retrieverStatus || 'offline')}`}>
                    {nodeStatus?.retrieverStatus || 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="font-medium">{nodeStatus?.nodeVersion || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent DA Activity</h3>
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
                    {activity.commitment && (
                      <div className="text-sm text-gray-600 font-mono">{activity.commitment.slice(0, 20)}...</div>
                    )}
                    {activity.details && (
                      <div className="text-sm text-gray-600">{activity.details}</div>
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

      {activeTab === 'commitments' && (
        <div className="space-y-6">
          {/* Commitments Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Data Availability Commitments</h3>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Submit Data
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search commitments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="finalized">Finalized</option>
                </select>
              </div>
            </div>
          </div>

          {/* Commitments List */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {filteredCommitments.map((commitment, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-4">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Commitment {commitment.commitment.slice(0, 16)}...
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatBytes(commitment.dataSize)} • {commitment.timestamp}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Receipt: {commitment.receiptId || 'N/A'} • Batch: {commitment.batchId || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded mb-1 ${getStatusColor(commitment.status)}`}>
                        {commitment.status}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedCommitment(commitment)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-800 text-sm flex items-center">
                          <Download className="w-3 h-3 mr-1" />
                          Retrieve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nodes' && (
        <div className="space-y-6">
          {/* Node Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">DA Node Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Server className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">DA Client Node</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeStatus?.isConnected ? 'synced' : 'disconnected')}`}>
                      {nodeStatus?.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{nodeStatus?.nodeVersion || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-medium">{nodeStatus?.networkId || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Block Height:</span>
                    <span className="font-medium">{nodeStatus?.blockHeight || '0'}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Cpu className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Encoder Node</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeStatus?.encoderStatus || 'offline')}`}>
                      {nodeStatus?.encoderStatus || 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing:</span>
                    <span className="font-medium">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GPU Support:</span>
                    <span className="font-medium">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parallel Mode:</span>
                    <span className="font-medium">On</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <MemoryStick className="w-6 h-6 text-purple-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Retriever Node</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeStatus?.retrieverStatus || 'offline')}`}>
                      {nodeStatus?.retrieverStatus || 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peers:</span>
                    <span className="font-medium">{nodeStatus?.peerCount || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sync Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeStatus?.syncStatus || 'disconnected')}`}>
                      {nodeStatus?.syncStatus || 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Throughput:</span>
                  <span className="font-medium">50 Gbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latency:</span>
                  <span className="font-medium">142ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Rate:</span>
                  <span className="font-medium">0.02%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Network Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Nodes:</span>
                  <span className="font-medium">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Nodes:</span>
                  <span className="font-medium">87</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Health:</span>
                  <span className="font-medium">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consensus Networks:</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </div>
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
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.totalSubmissions.toLocaleString() || '1,247'}
                  </div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-2 text-sm text-green-600">↑ 12.5% from last month</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.averageRetrievalTime || '0.8'}s
                  </div>
                  <div className="text-sm text-gray-600">Avg Retrieval Time</div>
                </div>
                <PieChart className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-2 text-sm text-green-600">↑ 8.3% faster</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.totalCost || '12.47'} OG
                  </div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-2 text-sm text-green-600">95% cheaper than traditional DA</div>
            </div>
          </div>

          {/* 24-Hour Activity */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Last 24 Hours</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {analytics?.last24Hours?.submissions || '47'}
                </div>
                <div className="text-sm text-gray-600">Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {analytics?.last24Hours?.retrievals || '156'}
                </div>
                <div className="text-sm text-gray-600">Retrievals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {analytics?.last24Hours?.errors || '1'}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">0G DA vs Traditional DA</h4>
                <div className="space-y-3">
                  {[
                    { metric: 'Throughput', value: '50 Gbps', improvement: '+5000%' },
                    { metric: 'Cost', value: '95% cheaper', improvement: '+9500%' },
                    { metric: 'Scalability', value: 'Infinite', improvement: '+∞%' },
                    { metric: 'Security', value: 'Ethereum-level', improvement: '+∞%' }
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
                  <div className="text-4xl font-bold text-blue-600 mb-2">50 Gbps</div>
                  <div className="text-gray-600">Demonstrated Throughput</div>
                  <div className="text-sm text-gray-500 mt-2">On Galileo Testnet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commitment Modal */}
      <CommitmentModal
        commitment={selectedCommitment}
        isOpen={!!selectedCommitment}
        onClose={() => setSelectedCommitment(null)}
      />
    </div>
  );
}
