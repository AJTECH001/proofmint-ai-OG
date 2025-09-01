import { useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ZeroGStorageService, UploadResponse, DownloadResponse, FileMetadata } from '../services/ZeroGStorageService';
import { getZeroGConfig } from '../config/zeroGConfig';

export interface UseZeroGStorageReturn {
  // Service instance
  storageService: ZeroGStorageService;
  
  // Upload operations
  uploadFile: (file: File) => Promise<UploadResponse>;
  uploadReceiptAttachment: (file: File, receiptId: string) => Promise<UploadResponse & { metadata?: FileMetadata }>;
  
  // Download operations
  downloadFile: (rootHash: string, filename?: string) => Promise<DownloadResponse>;
  downloadFileWithProof: (rootHash: string, filename?: string) => Promise<DownloadResponse>;
  getFileByTxSeq: (txSeq: number, filename?: string) => Promise<DownloadResponse>;
  
  // Receipt-specific operations
  getReceiptAttachments: (receiptId: string) => Promise<FileMetadata[]>;
  
  // KV operations
  writeKV: (streamId: number, keyValues: Record<string, string>) => Promise<any>;
  readKV: (streamId: number, keys: string[]) => Promise<any>;
  
  // State
  isUploading: boolean;
  isDownloading: boolean;
  uploadProgress: number;
  error: string | null;
  
  // Utilities
  clearError: () => void;
  isConfigured: boolean;
}

export function useZeroGStorage(): UseZeroGStorageReturn {
  const { address: _ } = useAccount(); // Keep hook for future use
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Create storage service instance
  const storageService = useMemo(() => {
    const config = getZeroGConfig();
    return new ZeroGStorageService(config);
  }, []);

  // Check if 0G Storage is properly configured
  const isConfigured = useMemo(() => {
    const config = getZeroGConfig();
    return !!(config.rpcUrl && config.indexerUrl);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Upload file with progress tracking
  const uploadFile = useCallback(async (file: File): Promise<UploadResponse> => {
    if (!isConfigured) {
      const errorMsg = '0G Storage is not properly configured';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await storageService.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [storageService, isConfigured]);

  // Upload receipt attachment
  const uploadReceiptAttachment = useCallback(async (file: File, receiptId: string) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage is not properly configured';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await storageService.uploadReceiptAttachment(file, receiptId);
      
      if (!result.success) {
        setError(result.error || 'Receipt attachment upload failed');
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Receipt attachment upload failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUploading(false);
    }
  }, [storageService, isConfigured]);

  // Download file
  const downloadFile = useCallback(async (rootHash: string, filename?: string): Promise<DownloadResponse> => {
    if (!isConfigured) {
      const errorMsg = '0G Storage is not properly configured';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsDownloading(true);
    setError(null);

    try {
      const result = await storageService.downloadFile(rootHash, filename);
      
      if (!result.success) {
        setError(result.error || 'Download failed');
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Download failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsDownloading(false);
    }
  }, [storageService, isConfigured]);

  // Download file with proof verification
  const downloadFileWithProof = useCallback(async (rootHash: string, filename?: string): Promise<DownloadResponse> => {
    if (!isConfigured) {
      const errorMsg = '0G Storage is not properly configured';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsDownloading(true);
    setError(null);

    try {
      const result = await storageService.downloadFileWithProof(rootHash, filename);
      
      if (!result.success) {
        setError(result.error || 'Verified download failed');
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Verified download failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsDownloading(false);
    }
  }, [storageService, isConfigured]);

  // Get file by transaction sequence
  const getFileByTxSeq = useCallback(async (txSeq: number, filename?: string): Promise<DownloadResponse> => {
    if (!isConfigured) {
      const errorMsg = '0G Storage is not properly configured';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsDownloading(true);
    setError(null);

    try {
      const result = await storageService.getFileByTxSeq(txSeq, filename);
      
      if (!result.success) {
        setError(result.error || 'Get file by txSeq failed');
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Get file by txSeq failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsDownloading(false);
    }
  }, [storageService, isConfigured]);

  // Get receipt attachments
  const getReceiptAttachments = useCallback(async (receiptId: string): Promise<FileMetadata[]> => {
    if (!isConfigured) {
      setError('0G Storage is not properly configured');
      return [];
    }

    try {
      return await storageService.getReceiptAttachments(receiptId);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get receipt attachments';
      setError(errorMsg);
      return [];
    }
  }, [storageService, isConfigured]);

  // KV operations
  const writeKV = useCallback(async (streamId: number, keyValues: Record<string, string>) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage is not properly configured';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      return await storageService.writeKV(streamId, keyValues);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'KV write failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [storageService, isConfigured]);

  const readKV = useCallback(async (streamId: number, keys: string[]) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage is not properly configured';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      return await storageService.readKV(streamId, keys);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'KV read failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [storageService, isConfigured]);

  return {
    storageService,
    uploadFile,
    uploadReceiptAttachment,
    downloadFile,
    downloadFileWithProof,
    getFileByTxSeq,
    getReceiptAttachments,
    writeKV,
    readKV,
    isUploading,
    isDownloading,
    uploadProgress,
    error,
    clearError,
    isConfigured
  };
}