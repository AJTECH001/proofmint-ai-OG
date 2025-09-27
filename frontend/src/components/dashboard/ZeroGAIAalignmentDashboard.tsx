import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Shield, Eye, AlertTriangle, CheckCircle, XCircle, TrendingUp, 
  Users, Zap, Activity, BarChart3, Settings, Vote, FileText,
  RefreshCw, Search, Filter, SortAsc, SortDesc, Clock, Award,
  Network, Cpu, Database, Lock, Unlock, Flag, Star, Target,
  Bell, ExternalLink, ChevronDown, ChevronRight, Info
} from 'lucide-react';
import { 
  zeroGAIAalignmentService,
  AIAlignmentNode,
  AIAlignmentMetrics,
  AIAlignmentReport,
  AIGovernanceProposal
} from '../../services/ZeroGAIAalignmentService';

interface AlignmentDashboardProps {
  className?: string;
}

export default function ZeroGAIAalignmentDashboard({ className = '' }: AlignmentDashboardProps) {
  const { address } = useAccount();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [alignmentNodes, setAlignmentNodes] = useState<AIAlignmentNode[]>([]);
  const [metrics, setMetrics] = useState<AIAlignmentMetrics | null>(null);
  const [reports, setReports] = useState<AIAlignmentReport[]>([]);
  const [proposals, setProposals] = useState<AIGovernanceProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<AIAlignmentNode | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<AIGovernanceProposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'monitoring' | 'flagged'>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Initialize service (in real implementation, this would use actual private key)
      const initialized = await zeroGAIAalignmentService.initialize('mock_private_key');
      
      if (initialized) {
        // Load alignment nodes
        const nodes = await zeroGAIAalignmentService.loadAlignmentNodes();
        setAlignmentNodes(nodes);
        
        // Load metrics
        const currentMetrics = await zeroGAIAalignmentService.loadMetrics();
        setMetrics(currentMetrics);
        
        // Load governance proposals
        const governanceProposals = await zeroGAIAalignmentService.getGovernanceProposals();
        setProposals(governanceProposals);
        
        // Simulate loading reports
        await loadReports();
      }
    } catch (error) {
      console.error('Failed to load alignment dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      // Simulate loading various types of reports
      const mockReports: AIAlignmentReport[] = [
        {
          reportId: 'report_001',
          nodeId: 'align_001',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          type: 'model_drift',
          severity: 'medium',
          description: 'Model drift detected in Llama 3.3 70B model',
          affectedComponents: ['llama_3.3_70b', 'inference_engine'],
          evidence: ['Output distribution shifted by 8.3%', 'Confidence scores decreased'],
          recommendations: ['Retrain model', 'Adjust thresholds'],
          status: 'investigating'
        },
        {
          reportId: 'report_002',
          nodeId: 'align_002',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          type: 'protocol_violation',
          severity: 'high',
          description: 'Validator node protocol violation detected',
          affectedComponents: ['validator_network', 'consensus'],
          evidence: ['Invalid block signature', 'Consensus participation below threshold'],
          recommendations: ['Slash validator', 'Remove from committee'],
          status: 'resolved'
        },
        {
          reportId: 'report_003',
          nodeId: 'align_003',
          timestamp: new Date(Date.now() - 10800000), // 3 hours ago
          type: 'security_incident',
          severity: 'critical',
          description: 'DDoS attack on storage nodes',
          affectedComponents: ['storage_network', 'data_availability'],
          evidence: ['Traffic spike 400%', 'Response time degradation'],
          recommendations: ['Activate DDoS protection', 'Scale capacity'],
          status: 'escalated'
        }
      ];
      
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'resolved':
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'monitoring':
      case 'investigating':
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'flagged':
      case 'escalated':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEther = (value: bigint) => {
    return parseFloat((Number(value) / 1e18).toFixed(4));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const filteredNodes = alignmentNodes.filter(node => {
    const matchesSearch = node.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || node.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
    node: AIAlignmentNode | null;
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
                <h3 className="text-xl font-bold text-gray-900">AI Alignment Node Details</h3>
                <p className="text-gray-600">Node ID: {node.nodeId}</p>
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(node.status)}`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tier:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(node.tier)}`}>
                      {node.tier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reputation:</span>
                    <span className="font-medium">{node.reputation}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Staked Amount:</span>
                    <span className="font-medium">{formatEther(node.stakedAmount)} OG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Rewards:</span>
                    <span className="font-medium">{formatEther(node.rewards)} OG</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <div className="font-mono text-sm mt-1 bg-gray-50 p-2 rounded">
                      {node.address}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Monitoring Targets:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {node.monitoringTargets.map((target, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {target}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="font-medium">{node.lastActivity.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                <Eye className="w-4 h-4 mr-2" />
                View Reports
              </button>
              <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Alignment Nodes</h2>
            <p className="text-gray-600">Decentralized AI safety and protocol monitoring</p>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-purple-600">
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">AI Safety & Governance</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-600">Network Secure</span>
              </div>
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
            label="🛡️ Overview"
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            id="nodes"
            label="🖥️ Alignment Nodes"
            isActive={activeTab === 'nodes'}
            onClick={() => setActiveTab('nodes')}
          />
          <TabButton
            id="reports"
            label="📋 Reports"
            isActive={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />
          <TabButton
            id="governance"
            label="🗳️ Governance"
            isActive={activeTab === 'governance'}
            onClick={() => setActiveTab('governance')}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.networkHealth || '98.5'}%
                  </div>
                  <div className="text-sm text-gray-600">Network Health</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {alignmentNodes.filter(n => n.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Nodes</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.anomaliesFlagged || '7'}
                  </div>
                  <div className="text-sm text-gray-600">Issues Flagged</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.last24Hours?.rewardsEarned || '216.7'}
                  </div>
                  <div className="text-sm text-gray-600">24h Rewards (OG)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Alignment Activity</h3>
            <div className="space-y-4">
              {reports.slice(0, 5).map((report, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {report.type === 'model_drift' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {report.type === 'protocol_violation' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                    {report.type === 'security_incident' && <Shield className="w-4 h-4 text-red-600" />}
                    {report.type === 'performance_anomaly' && <Activity className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{report.description}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className="text-xs text-gray-500">{report.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Node: {report.nodeId} • Status: {report.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Security Status */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Network Security Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">AI Models</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Drift Detected:</span>
                    <span className="font-medium">{metrics?.modelDriftDetected || '3'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Models Monitored:</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safety Score:</span>
                    <span className="font-medium text-green-600">98.2%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Network className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Protocol Compliance</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Violations:</span>
                    <span className="font-medium">{metrics?.protocolViolations || '1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nodes Monitored:</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compliance Rate:</span>
                    <span className="font-medium text-green-600">99.4%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-purple-600 mr-3" />
                  <h4 className="font-semibold text-gray-900">Security Events</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Incidents:</span>
                    <span className="font-medium">{metrics?.securityIncidents || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Threats Blocked:</span>
                    <span className="font-medium">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-medium text-green-600">2.3s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nodes' && (
        <div className="space-y-6">
          {/* Nodes Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Alignment Nodes</h3>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Deploy Node
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search nodes..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nodes List */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {filteredNodes.map((node, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-4">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {node.nodeId}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatAddress(node.address)} • {formatEther(node.stakedAmount)} OG staked
                        </div>
                        <div className="text-xs text-gray-500">
                          Reputation: {node.reputation}% • Rewards: {formatEther(node.rewards)} OG
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(node.status)}`}>
                          {node.status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getTierColor(node.tier)}`}>
                          {node.tier}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedNode(node);
                            setShowNodeModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-800 text-sm flex items-center">
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
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

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Reports Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alignment Reports</h3>
              <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Scan
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {reports.map((report, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {report.type === 'model_drift' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                        {report.type === 'protocol_violation' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                        {report.type === 'security_incident' && <Shield className="w-5 h-5 text-red-600" />}
                        {report.type === 'performance_anomaly' && <Activity className="w-5 h-5 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{report.description}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {report.evidence.slice(0, 2).join(' • ')}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Report ID: {report.reportId} • Node: {report.nodeId} • {report.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded mb-1 ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                        {report.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'governance' && (
        <div className="space-y-6">
          {/* Governance Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Governance Proposals</h3>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                <Vote className="w-4 h-4 mr-2" />
                Create Proposal
              </button>
            </div>
          </div>

          {/* Proposals List */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {proposals.map((proposal, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{proposal.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{proposal.description}</div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Category: {proposal.category}</span>
                        <span>Proposer: {formatAddress(proposal.proposer)}</span>
                        <span>Deadline: {proposal.deadline.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className="text-green-600">
                          {formatEther(proposal.votesFor)} FOR
                        </span>
                        <span className="text-red-600">
                          {formatEther(proposal.votesAgainst)} AGAINST
                        </span>
                        <span className="text-blue-600">
                          {proposal.alignmentNodeSupport}% Alignment Support
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded mb-2 ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </div>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        {proposal.status === 'active' && (
                          <button className="text-green-600 hover:text-green-800 text-sm flex items-center">
                            <Vote className="w-3 h-3 mr-1" />
                            Vote
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Node Modal */}
      <NodeModal
        node={selectedNode}
        isOpen={showNodeModal}
        onClose={() => setShowNodeModal(false)}
      />
    </div>
  );
}
