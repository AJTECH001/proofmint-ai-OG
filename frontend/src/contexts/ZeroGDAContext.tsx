import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { zeroGDAService, DABlobData, DACommitment, DANodeStatus, DASubmissionResult, DARetrievalResult } from '../services/ZeroGDAService';

interface ZeroGDAContextType {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  nodeStatus: DANodeStatus | null;
  error: string | null;
  
  // Actions
  initializeDA: (config?: any) => Promise<boolean>;
  submitReceiptData: (data: DABlobData) => Promise<DASubmissionResult>;
  getReceiptData: (commitment: string) => Promise<DARetrievalResult>;
  verifyDataAvailability: (commitment: string) => Promise<boolean>;
  getBlobStatus: (commitment: string) => Promise<DACommitment | null>;
  estimateCost: (dataSize: number) => Promise<{ cost: string; gasEstimate: number }>;
  refreshNodeStatus: () => Promise<void>;
  clearError: () => void;

  // Computed properties
  isConnected: boolean;
  canSubmitData: boolean;
}

const ZeroGDAContext = createContext<ZeroGDAContextType | undefined>(undefined);

interface ZeroGDAProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

export const ZeroGDAProvider: React.FC<ZeroGDAProviderProps> = ({ 
  children, 
  autoInitialize = false 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<DANodeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Initialize DA service
  const initializeDA = async (config?: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await zeroGDAService.initialize(config);
      setIsInitialized(result.success);
      
      if (result.success) {
        await refreshNodeStatus();
      } else {
        setError(result.error || 'Failed to initialize 0G DA service');
      }
      
      return result.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit receipt data to 0G DA
  const submitReceiptData = async (data: DABlobData): Promise<DASubmissionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await zeroGDAService.submitReceiptData(data);
      
      if (!result.success) {
        setError(result.error || 'Submission failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Get receipt data from 0G DA
  const getReceiptData = async (commitment: string): Promise<DARetrievalResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await zeroGDAService.getReceiptData(commitment);
      
      if (!result.success) {
        setError(result.error || 'Retrieval failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retrieval error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify data availability
  const verifyDataAvailability = async (commitment: string): Promise<boolean> => {
    try {
      const result = await zeroGDAService.verifyDataAvailability(commitment);
      return result.success && result.available === true;
    } catch (err) {
      console.error('Data availability verification failed:', err);
      return false;
    }
  };

  // Get blob status
  const getBlobStatus = async (commitment: string): Promise<DACommitment | null> => {
    try {
      const result = await zeroGDAService.getBlobStatus(commitment);
      return result.success ? result.status || null : null;
    } catch (err) {
      console.error('Blob status check failed:', err);
      return null;
    }
  };

  // Estimate cost
  const estimateCost = async (dataSize: number): Promise<{ cost: string; gasEstimate: number }> => {
    try {
      const result = await zeroGDAService.estimateCost(dataSize);
      return {
        cost: result.cost || '0.001',
        gasEstimate: result.gasEstimate || 21000
      };
    } catch (err) {
      console.error('Cost estimation failed:', err);
      return { cost: '0.001', gasEstimate: 21000 };
    }
  };

  // Refresh node status
  const refreshNodeStatus = async (): Promise<void> => {
    try {
      const status = await zeroGDAService.getNodeStatus();
      setNodeStatus(status);
      
      if (!status.isConnected && isInitialized) {
        setError('Connection to DA node lost');
      }
    } catch (err) {
      console.error('Node status refresh failed:', err);
      setNodeStatus({
        isConnected: false,
        nodeVersion: 'unknown',
        networkId: 'unknown',
        blockHeight: 0,
        peerCount: 0,
        syncStatus: 'disconnected',
        encoderStatus: 'offline',
        retrieverStatus: 'offline'
      });
    }
  };

  // Auto-initialize on mount if requested
  useEffect(() => {
    if (autoInitialize) {
      initializeDA();
    }
  }, [autoInitialize]);

  // Periodic status updates when initialized
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(refreshNodeStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Computed properties
  const isConnected = nodeStatus?.isConnected || false;
  const canSubmitData = isInitialized && isConnected && !isLoading;

  const contextValue: ZeroGDAContextType = {
    // State
    isInitialized,
    isLoading,
    nodeStatus,
    error,
    
    // Actions
    initializeDA,
    submitReceiptData,
    getReceiptData,
    verifyDataAvailability,
    getBlobStatus,
    estimateCost,
    refreshNodeStatus,
    clearError,
    
    // Computed properties
    isConnected,
    canSubmitData
  };

  return (
    <ZeroGDAContext.Provider value={contextValue}>
      {children}
    </ZeroGDAContext.Provider>
  );
};

export const useZeroGDA = (): ZeroGDAContextType => {
  const context = useContext(ZeroGDAContext);
  if (!context) {
    throw new Error('useZeroGDA must be used within a ZeroGDAProvider');
  }
  return context;
};

// Custom hook for receipt data management with 0G DA
export const useReceiptDA = () => {
  const {
    submitReceiptData,
    getReceiptData,
    verifyDataAvailability,
    getBlobStatus,
    estimateCost,
    isConnected,
    canSubmitData,
    isLoading,
    error
  } = useZeroGDA();

  // Submit receipt with optimizations
  const submitReceipt = async (
    receiptData: DABlobData,
    onProgress?: (status: string) => void
  ): Promise<DASubmissionResult> => {
    onProgress?.('Preparing receipt data...');
    
    // Estimate cost first
    const dataSize = new TextEncoder().encode(JSON.stringify(receiptData)).length;
    const costEstimate = await estimateCost(dataSize);
    
    onProgress?.(`Estimated cost: ${costEstimate.cost} tokens`);
    onProgress?.('Submitting to 0G DA...');
    
    const result = await submitReceiptData(receiptData);
    
    if (result.success) {
      onProgress?.('Receipt submitted successfully!');
    } else {
      onProgress?.(`Submission failed: ${result.error}`);
    }
    
    return result;
  };

  // Enhanced receipt retrieval with verification
  const getVerifiedReceipt = async (
    commitment: string,
    onProgress?: (status: string) => void
  ): Promise<DARetrievalResult & { isVerified?: boolean }> => {
    onProgress?.('Checking data availability...');
    
    const isAvailable = await verifyDataAvailability(commitment);
    if (!isAvailable) {
      return {
        success: false,
        error: 'Data not available in 0G DA network'
      };
    }
    
    onProgress?.('Retrieving receipt data...');
    
    const result = await getReceiptData(commitment);
    
    if (result.success) {
      onProgress?.('Verifying data integrity...');
      
      // Additional verification steps could be added here
      const status = await getBlobStatus(commitment);
      const isFullyVerified = result.verified && status?.status === 'finalized';
      
      onProgress?.(isFullyVerified ? 'Receipt verified and finalized' : 'Receipt retrieved (pending finalization)');
      
      return {
        ...result,
        isVerified: isFullyVerified
      };
    }
    
    onProgress?.(`Retrieval failed: ${result.error}`);
    return result;
  };

  return {
    submitReceipt,
    getVerifiedReceipt,
    estimateCost,
    verifyDataAvailability,
    getBlobStatus,
    isConnected,
    canSubmitData,
    isLoading,
    error
  };
};