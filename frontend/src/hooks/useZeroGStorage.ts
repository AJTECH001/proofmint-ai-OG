import { useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ZeroGStorageService, UploadResponse, DownloadResponse, FileMetadata, MultipleUploadResponse } from '../services/ZeroGStorageService';
import { zeroGStorageService, validateZeroGConfig } from '../config/zeroGConfig';

export interface UseZeroGStorageReturn {
  // Service instance
  storageService: ZeroGStorageService;
  
  // Upload operations
  uploadFile: (file: File) => Promise<UploadResponse>;
  uploadMultipleFiles: (files: File[]) => Promise<MultipleUploadResponse>;
  uploadReceiptAttachment: (file: File, receiptId: string) => Promise<UploadResponse & { metadata?: FileMetadata }>;
  
  // Download operations
  downloadFile: (rootHash: string, filename?: string) => Promise<DownloadResponse>;
  downloadFileWithProof: (rootHash: string, filename?: string) => Promise<DownloadResponse>;
  
  // Receipt-specific operations
  getReceiptAttachments: (receiptId: string) => Promise<FileMetadata[]>;
  storeReceiptMetadata: (receiptId: string, metadata: any) => Promise<any>;
  getReceiptMetadata: (receiptId: string) => Promise<any>;
  
  // KV operations
  writeKV: (streamId: number, key: string, value: string) => Promise<any>;
  readKV: (streamId: number, key: string) => Promise<any>;
  
  // Health check
  healthCheck: () => Promise<{ healthy: boolean; details: any }>;
  
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

  // Use the singleton storage service instance
  const storageService = zeroGStorageService;
  
  // Check if 0G Storage is properly configured
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Check configuration on mount
  useMemo(async () => {
    try {
      const configured = await validateZeroGConfig();
      setIsConfigured(configured);
    } catch (error) {
      console.error('Failed to validate 0G config:', error);
      setIsConfigured(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Upload file with progress tracking
  const uploadFile = useCallback(async (file: File): Promise<UploadResponse> => {
    if (!isConfigured) {
      const errorMsg = '0G Storage backend is not available';
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
  
  // Upload multiple files
  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<MultipleUploadResponse> => {
    if (!isConfigured) {
      const errorMsg = '0G Storage backend is not available';
      setError(errorMsg);
      return { success: false, uploads: [], total: 0, successful: 0, failed: files.length };
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await storageService.uploadMultipleFiles(files);
      
      if (!result.success) {
        setError('Some uploads failed');
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Multiple upload failed';
      setError(errorMsg);
      return { success: false, uploads: [], total: 0, successful: 0, failed: files.length };
    } finally {
      setIsUploading(false);
    }
  }, [storageService, isConfigured]);

  // Upload receipt attachment
  const uploadReceiptAttachment = useCallback(async (file: File, receiptId: string) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage backend is not available';
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
      const errorMsg = '0G Storage backend is not available';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsDownloading(true);
    setError(null);

    try {
      const result = await storageService.downloadFile(rootHash, filename);
      
      if (!result.success) {
        setError(result.error || 'Download failed');
      } else if (result.data) {
        // Create download link for the blob
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `file_${rootHash.slice(0, 8)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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

  // Download file with proof verification (same as downloadFile since backend handles verification)
  const downloadFileWithProof = useCallback(async (rootHash: string, filename?: string): Promise<DownloadResponse> => {
    // Backend handles proof verification by default
    return downloadFile(rootHash, filename);
  }, [downloadFile]);


  // Get receipt attachments
  const getReceiptAttachments = useCallback(async (receiptId: string): Promise<FileMetadata[]> => {
    if (!isConfigured) {
      setError('0G Storage backend is not available');
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
  
  // Store receipt metadata
  const storeReceiptMetadata = useCallback(async (receiptId: string, metadata: any) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage backend is not available';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      return await storageService.storeReceiptMetadata(receiptId, metadata);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to store receipt metadata';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [storageService, isConfigured]);
  
  // Get receipt metadata
  const getReceiptMetadata = useCallback(async (receiptId: string) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage backend is not available';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      return await storageService.getReceiptMetadata(receiptId);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get receipt metadata';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [storageService, isConfigured]);

  // KV operations
  const writeKV = useCallback(async (streamId: number, key: string, value: string) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage backend is not available';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      return await storageService.writeKV(streamId, key, value);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'KV write failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [storageService, isConfigured]);

  const readKV = useCallback(async (streamId: number, key: string) => {
    if (!isConfigured) {
      const errorMsg = '0G Storage backend is not available';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      return await storageService.readKV(streamId, key);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'KV read failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [storageService, isConfigured]);
  
  // Health check
  const healthCheck = useCallback(async () => {
    try {
      return await storageService.healthCheck();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Health check failed';
      return {
        healthy: false,
        details: { error: errorMsg }
      };
    }
  }, [storageService]);

  return {
    storageService,
    uploadFile,
    uploadMultipleFiles,
    uploadReceiptAttachment,
    downloadFile,
    downloadFileWithProof,
    getReceiptAttachments,
    storeReceiptMetadata,
    getReceiptMetadata,
    writeKV,
    readKV,
    healthCheck,
    isUploading,
    isDownloading,
    uploadProgress,
    error,
    clearError,
    isConfigured
  };
}