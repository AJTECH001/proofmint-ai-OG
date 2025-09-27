import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit2, 
  Trash2, 
  Flag,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { LoadingOverlay, LoadingSpinner } from '../ui/LoadingSpinner';
import { useNotification } from '../ui/NotificationSystem';
import { EnhancedProofMintService } from '../../services/EnhancedProofMintService';
import { ReceiptDisplay, GadgetStatus, PaginatedResponse } from '../../types/proofmint';
import { ethers } from 'ethers';

interface AdvancedReceiptManagerProps {
  userAddress: string;
  userRole: 'merchant' | 'buyer' | 'recycler' | 'admin';
  provider?: ethers.BrowserProvider;
}

interface FilterState {
  search: string;
  status: GadgetStatus | 'all';
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'id' | 'status';
  sortOrder: 'asc' | 'desc';
}

export const AdvancedReceiptManager: React.FC<AdvancedReceiptManagerProps> = ({
  userAddress,
  userRole,
  provider
}) => {
  const [receipts, setReceipts] = useState<ReceiptDisplay[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const { addNotification } = useNotification();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadReceipts();
  }, [userAddress, userRole, currentPage]);

  useEffect(() => {
    applyFilters();
  }, [receipts, filters]);

  const loadReceipts = async (page = currentPage) => {
    try {
      if (page === 0) setLoading(true);
      else setRefreshing(true);

      let result;
      if (userRole === 'merchant') {
        result = await EnhancedProofMintService.getMerchantReceipts(userAddress, page, ITEMS_PER_PAGE);
      } else {
        result = await EnhancedProofMintService.getUserReceipts(userAddress, page, ITEMS_PER_PAGE);
      }

      if (result.success && result.data) {
        const newReceipts = page === 0 ? result.data.items : [...receipts, ...result.data.items];
        setReceipts(newReceipts);
        setTotalPages(Math.ceil(result.data.total / ITEMS_PER_PAGE));
        setHasMore(result.data.hasMore);
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to load receipts'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load receipts'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...receipts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(receipt => 
        receipt.id.toString().includes(searchLower) ||
        receipt.buyer.toLowerCase().includes(searchLower) ||
        receipt.merchant.toLowerCase().includes(searchLower) ||
        receipt.ipfsHash.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(receipt => receipt.gadgetStatus === filters.status);
    }

    // Date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(receipt => 
        new Date(Number(receipt.timestamp) * 1000) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(receipt => 
        new Date(Number(receipt.timestamp) * 1000) <= toDate
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = Number(a.timestamp) - Number(b.timestamp);
          break;
        case 'id':
          comparison = Number(a.id) - Number(b.id);
          break;
        case 'status':
          comparison = a.gadgetStatus - b.gadgetStatus;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredReceipts(filtered);
  }, [receipts, filters]);

  const handleRefresh = () => {
    setCurrentPage(0);
    loadReceipts(0);
  };

  const handleLoadMore = () => {
    if (hasMore && !refreshing) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadReceipts(nextPage);
    }
  };

  const handleSelectReceipt = (receiptId: string) => {
    const newSelected = new Set(selectedReceipts);
    if (newSelected.has(receiptId)) {
      newSelected.delete(receiptId);
    } else {
      newSelected.add(receiptId);
    }
    setSelectedReceipts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedReceipts.size === filteredReceipts.length) {
      setSelectedReceipts(new Set());
    } else {
      setSelectedReceipts(new Set(filteredReceipts.map(r => r.id.toString())));
    }
  };

  const handleFlagReceipt = async (receiptId: bigint, status: GadgetStatus) => {
    if (!provider) {
      addNotification({
        type: 'error',
        title: 'No Provider',
        message: 'Please connect your wallet'
      });
      return;
    }

    try {
      const result = await EnhancedProofMintService.flagGadget(
        receiptId,
        status,
        provider,
        userAddress
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: 'Receipt status updated successfully'
        });
        handleRefresh();
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: result.error || 'Failed to update receipt status'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Transaction Error',
        message: 'Failed to update receipt status'
      });
    }
  };

  const handleRecycleGadget = async (receiptId: bigint) => {
    if (!provider) {
      addNotification({
        type: 'error',
        title: 'No Provider',
        message: 'Please connect your wallet'
      });
      return;
    }

    try {
      const result = await EnhancedProofMintService.recycleGadget(
        receiptId,
        provider,
        userAddress
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Gadget Recycled',
          message: 'Gadget marked as recycled successfully'
        });
        handleRefresh();
      } else {
        addNotification({
          type: 'error',
          title: 'Recycle Failed',
          message: result.error || 'Failed to recycle gadget'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Transaction Error',
        message: 'Failed to recycle gadget'
      });
    }
  };

  const getStatusBadge = (status: GadgetStatus) => {
    const statusConfig = {
      [GadgetStatus.UNKNOWN]: { color: 'gray', text: 'Unknown' },
      [GadgetStatus.SOLD]: { color: 'blue', text: 'Sold' },
      [GadgetStatus.USED]: { color: 'yellow', text: 'Used' },
      [GadgetStatus.BROKEN]: { color: 'red', text: 'Broken' },
      [GadgetStatus.RECYCLED]: { color: 'green', text: 'Recycled' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        {config.text}
      </span>
    );
  };

  const ReceiptActions: React.FC<{ receipt: ReceiptDisplay }> = ({ receipt }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          icon={<MoreVertical className="w-4 h-4" />}
        />
        
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10"
            >
              <div className="py-1">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    // View receipt details
                    setShowMenu(false);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                
                {userRole === 'buyer' && (
                  <>
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        handleFlagReceipt(receipt.id, GadgetStatus.USED);
                        setShowMenu(false);
                      }}
                    >
                      <Flag className="w-4 h-4" />
                      Mark as Used
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        handleFlagReceipt(receipt.id, GadgetStatus.BROKEN);
                        setShowMenu(false);
                      }}
                    >
                      <Flag className="w-4 h-4" />
                      Mark as Broken
                    </button>
                  </>
                )}

                {userRole === 'recycler' && (
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => {
                      handleRecycleGadget(receipt.id);
                      setShowMenu(false);
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Mark as Recycled
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <LoadingOverlay isLoading={loading} text="Loading receipts...">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Receipt Management</h2>
            <p className="text-gray-600">Manage and track your receipts</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="w-4 h-4" />}
            >
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            {userRole === 'merchant' && (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
              >
                Issue Receipt
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <FormField label="Search">
                      <Input
                        placeholder="Search receipts..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                    </FormField>

                    <FormField label="Status">
                      <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                      >
                        <option value="all">All Statuses</option>
                        <option value={GadgetStatus.SOLD}>Sold</option>
                        <option value={GadgetStatus.USED}>Used</option>
                        <option value={GadgetStatus.BROKEN}>Broken</option>
                        <option value={GadgetStatus.RECYCLED}>Recycled</option>
                      </Select>
                    </FormField>

                    <FormField label="From Date">
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      />
                    </FormField>

                    <FormField label="To Date">
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      />
                    </FormField>

                    <FormField label="Sort By">
                      <Select
                        value={filters.sortBy}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      >
                        <option value="date">Date</option>
                        <option value="id">ID</option>
                        <option value="status">Status</option>
                      </Select>
                    </FormField>

                    <FormField label="Order">
                      <Select
                        value={filters.sortOrder}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </Select>
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions */}
        {selectedReceipts.size > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedReceipts.size} receipt{selectedReceipts.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Export Selected
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedReceipts(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receipts Table */}
        <Card>
          <CardContent padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={filteredReceipts.length > 0 && selectedReceipts.size === filteredReceipts.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {userRole === 'merchant' ? 'Buyer' : 'Merchant'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IPFS</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <motion.tr
                      key={receipt.id.toString()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReceipts.has(receipt.id.toString())}
                          onChange={() => handleSelectReceipt(receipt.id.toString())}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{receipt.shortId}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          {userRole === 'merchant' ? receipt.shortBuyer : receipt.shortMerchant}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(receipt.gadgetStatus)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{receipt.formattedTimestamp}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">
                          {receipt.ipfsHash.slice(0, 12)}...
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ReceiptActions receipt={receipt} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredReceipts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No receipts found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo
                      ? 'Try adjusting your filters'
                      : 'Start by issuing your first receipt'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="border-t p-4 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={refreshing}
                  isLoading={refreshing}
                  loadingText="Loading more..."
                >
                  Load More Receipts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LoadingOverlay>
  );
};