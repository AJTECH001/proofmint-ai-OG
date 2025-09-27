import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProofMintService, Receipt, ReceiptStats } from "../../services/ProofMintService";
import ZeroGStorageManagementDashboard from "./ZeroGStorageManagementDashboard";
import ZeroGDADashboard from "./ZeroGDADashboard";
import { 
  Receipt as ReceiptIcon, 
  DollarSign, 
  Recycle, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Menu,
  Home,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Search,
  ChevronDown,
  Shield,
  Zap,
  Database,
  Layers
} from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [stats, setStats] = useState<ReceiptStats>({ total: 0, paid: 0, unpaid: 0, recycled: 0 });
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add merchant form
  const [showAddMerchant, setShowAddMerchant] = useState(false);
  const [newMerchantAddress, setNewMerchantAddress] = useState("");
  const [addingMerchant, setAddingMerchant] = useState(false);
  
  // Add recycler form
  const [showAddRecycler, setShowAddRecycler] = useState(false);
  const [newRecyclerAddress, setNewRecyclerAddress] = useState("");
  const [addingRecycler, setAddingRecycler] = useState(false);

  const [contractStats, setContractStats] = useState<{
    totalReceipts: number;
  } | null>(null);

  // Sidebar and navigation state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const ZG_TESTNET_ID = 16601;
  const isCorrectNetwork = chainId === ZG_TESTNET_ID;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data individually with error handling for each
      const results = await Promise.allSettled([
        ProofMintService.getReceiptStats(),
        ProofMintService.getAllReceipts(),
        ProofMintService.getContractStats(),
      ]);

      // Handle receipt stats
      if (results[0].status === 'fulfilled') {
        setStats(results[0].value);
      } else {
        console.warn("Failed to load receipt stats:", results[0].reason);
        setStats({ total: 0, paid: 0, unpaid: 0, recycled: 0 });
      }

      // Handle receipts
      if (results[1].status === 'fulfilled') {
        setReceipts(results[1].value);
      } else {
        console.warn("Failed to load receipts:", results[1].reason);
        setReceipts([]);
      }

      // Handle contract stats
      if (results[2].status === 'fulfilled') {
        setContractStats(results[2].value);
      } else {
        console.warn("Failed to load contract stats:", results[2].reason);
        setContractStats({ totalReceipts: 0 });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error("Error loading admin data:", err);
      // Set default values
      setStats({ total: 0, paid: 0, unpaid: 0, recycled: 0 });
      setReceipts([]);
      setContractStats({ totalReceipts: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork && address) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isConnected, isCorrectNetwork, address]);

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchantAddress.trim()) return;

    try {
      setAddingMerchant(true);
      await ProofMintService.addMerchant(newMerchantAddress);
      setNewMerchantAddress("");
      setShowAddMerchant(false);
      // Refresh data
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add merchant");
    } finally {
      setAddingMerchant(false);
    }
  };

  const handleAddRecycler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecyclerAddress.trim()) return;

    try {
      setAddingRecycler(true);
      await ProofMintService.addRecycler(newRecyclerAddress);
      setNewRecyclerAddress("");
      setShowAddRecycler(false);
      // Refresh data
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add recycler");
    } finally {
      setAddingRecycler(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <p className="mb-6 text-gray-600">Connect your wallet to access admin functions</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Wrong Network</h2>
          <p className="text-gray-600">Please switch to 0G Testnet (Chain ID: 16601)</p>
        </div>
      </div>
    );
  }

  // Navigation items for sidebar
    const navigationItems = [
      { id: 'overview', name: 'Overview', icon: Home },
      { id: 'receipts', name: 'Receipts', icon: ReceiptIcon },
      { id: 'merchants', name: 'Merchants', icon: ShoppingCart },
      { id: 'recyclers', name: 'Recyclers', icon: Recycle },
      { id: 'storage', name: '0G Storage', icon: Database },
      { id: 'da', name: '0G Data Availability', icon: Layers },
      { id: 'analytics', name: 'Analytics', icon: BarChart3 },
      { id: 'users', name: 'Users', icon: Users },
      { id: 'settings', name: 'Settings', icon: Settings },
    ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-xl font-bold text-white">ProofMint</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Menu</p>
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-colors ${
                    activeSection === item.id
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Stats in Sidebar */}
        <div className="mt-8 mx-4">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-lg text-white">
            <div className="flex items-center">
              <Zap className="w-6 h-6 mr-2" />
              <div>
                <p className="text-sm opacity-90">Total Receipts</p>
                <p className="text-2xl font-bold">{contractStats?.totalReceipts || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your ProofMint system</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Wallet Connection */}
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Render content based on active section */}
              {activeSection === 'overview' && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ReceiptIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Paid Receipts</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Unpaid Receipts</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.unpaid}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Recycle className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Recycled Items</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.recycled}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Stats */}
                  {contractStats && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Contract Receipts</p>
                          <p className="text-xl font-bold text-gray-900">{contractStats.totalReceipts}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeSection === 'merchants' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Merchant Management</h2>
                      <button
                        onClick={() => setShowAddMerchant(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Merchant</span>
                      </button>
                    </div>

                    {showAddMerchant && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-lg font-medium mb-4">Add New Merchant</h3>
                        <form onSubmit={handleAddMerchant} className="space-y-4">
                          <input
                            type="text"
                            placeholder="Merchant wallet address (0x...)"
                            value={newMerchantAddress}
                            onChange={(e) => setNewMerchantAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                          />
                          <div className="flex gap-4">
                            <button
                              type="submit"
                              disabled={addingMerchant}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {addingMerchant ? "Adding..." : "Add Merchant"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddMerchant(false)}
                              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'recyclers' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Recycler Management</h2>
                      <button
                        onClick={() => setShowAddRecycler(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Recycler</span>
                      </button>
                    </div>

                    {showAddRecycler && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-lg font-medium mb-4">Add New Recycler</h3>
                        <form onSubmit={handleAddRecycler} className="space-y-4">
                          <input
                            type="text"
                            placeholder="Recycler wallet address (0x...)"
                            value={newRecyclerAddress}
                            onChange={(e) => setNewRecyclerAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                          <div className="flex gap-4">
                            <button
                              type="submit"
                              disabled={addingRecycler}
                              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                              {addingRecycler ? "Adding..." : "Add Recycler"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddRecycler(false)}
                              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'receipts' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Receipts</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {receipts.length > 0 ? (
                          receipts.slice(0, 10).map((receipt) => (
                            <tr key={receipt.id.toString()} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                #{receipt.id.toString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {ProofMintService.formatAddress(receipt.merchant)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {ProofMintService.formatAddress(receipt.buyer)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  receipt.isPaid
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {receipt.isPaid ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {ProofMintService.formatDate(receipt.timestamp)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              No receipts found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 0G Storage Section */}
              {activeSection === 'storage' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <ZeroGStorageManagementDashboard />
                </div>
              )}

              {/* 0G Data Availability Section */}
              {activeSection === 'da' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <ZeroGDADashboard />
                </div>
              )}

              {/* Default sections for other navigation items */}
              {!['overview', 'merchants', 'recyclers', 'receipts', 'storage', 'da'].includes(activeSection) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Settings className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {navigationItems.find(item => item.id === activeSection)?.name || 'Coming Soon'}
                    </h3>
                    <p className="text-gray-500">This section is currently under development.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminDashboard;
