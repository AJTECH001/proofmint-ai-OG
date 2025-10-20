import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Shield, 
  Database,
  Zap,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

interface Enhanced0GStorageUploadProps {
  receiptId?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  showAdvancedInfo?: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  rootHash: string;
  txHash?: string;
  uploadTimestamp: Date;
  verificationProof?: string;
  daCommitment?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  rootHash?: string;
  txHash?: string;
  error?: string;
}

export const Enhanced0GStorageUpload: React.FC<Enhanced0GStorageUploadProps> = ({
  receiptId,
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  showAdvancedInfo = true
}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToZeroG = async (file: File, progressCallback: (progress: number) => void): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (receiptId) {
      formData.append('receiptId', receiptId);
    }

    try {
      // Update status to processing
      progressCallback(90);

      const endpoint = receiptId 
        ? `/api/storage/receipt/${receiptId}/attachment`
        : '/api/storage/upload';

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 85) / progressEvent.total);
              progressCallback(progress);
            }
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Upload failed');
      }

      progressCallback(100);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        rootHash: response.data.rootHash,
        txHash: response.data.txHash,
        uploadTimestamp: new Date(),
        verificationProof: response.data.verificationProof,
        daCommitment: response.data.daCommitment
      };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);
    setIsUploading(true);

    // Initialize upload queue
    const initialQueue: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setUploadQueue(initialQueue);

    // Upload files sequentially
    const newUploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        // Update status to uploading
        setUploadQueue(prev => 
          prev.map(item => 
            item.file === file 
              ? { ...item, status: 'uploading' as const }
              : item
          )
        );

        const uploaded = await uploadToZeroG(file, (progress) => {
          setUploadQueue(prev => 
            prev.map(item => 
              item.file === file 
                ? { ...item, progress, status: progress === 100 ? 'success' : 'uploading' }
                : item
            )
          );
        });

        newUploadedFiles.push(uploaded);

        // Update to success
        setUploadQueue(prev => 
          prev.map(item => 
            item.file === file 
              ? { ...item, status: 'success', rootHash: uploaded.rootHash, txHash: uploaded.txHash }
              : item
          )
        );

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        
        // Update to error
        setUploadQueue(prev => 
          prev.map(item => 
            item.file === file 
              ? { ...item, status: 'error', error: errorMsg }
              : item
          )
        );
        
        setError(errorMsg);
      }
    }

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    setIsUploading(false);

    if (onUploadComplete && newUploadedFiles.length > 0) {
      onUploadComplete(newUploadedFiles);
    }
  }, [receiptId, maxFiles, uploadedFiles.length, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize: maxFileSize,
    disabled: isUploading
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const clearQueue = () => {
    setUploadQueue([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with 0G Branding */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-3">
          <Database className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">0G Decentralized Storage</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Cryptographic Proof</p>
              <p className="text-gray-600">Every file verified with Merkle proofs</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">10-100x Cheaper</p>
              <p className="text-gray-600">Than traditional cloud storage</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Database className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Decentralized</p>
              <p className="text-gray-600">No single point of failure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-green-500 bg-green-50 scale-105' 
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-900">
            {isDragActive 
              ? 'Drop files to upload to 0G Storage' 
              : 'Upload Files to 0G Network'
            }
          </p>
          <p className="text-sm text-gray-600">
            Drag & drop or click to select files
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 mt-3">
            <span>Max {maxFiles} files</span>
            <span>•</span>
            <span>Up to {formatBytes(maxFileSize)} per file</span>
            <span>•</span>
            <span>{uploadedFiles.length}/{maxFiles} uploaded</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800">Upload Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Upload Progress</h4>
            {!isUploading && (
              <button
                onClick={clearQueue}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          
          {uploadQueue.map((item, index) => (
            <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {(item.status === 'uploading' || item.status === 'processing') && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    {item.status === 'processing' ? 'Processing...' : `Uploading ${item.progress}%`}
                  </p>
                </div>
              )}

              {/* Success Info */}
              {item.status === 'success' && item.rootHash && showAdvancedInfo && (
                <div className="mt-3 space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-green-800">Root Hash</p>
                      <button
                        onClick={() => copyToClipboard(item.rootHash!)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-green-700 font-mono break-all mt-1">
                      {item.rootHash}
                    </p>
                  </div>
                  {item.txHash && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-blue-800">Transaction Hash</p>
                        <button
                          onClick={() => copyToClipboard(item.txHash!)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-blue-700 font-mono break-all mt-1">
                        {item.txHash}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Info */}
              {item.status === 'error' && item.error && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-xs text-red-800">{item.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">
            Stored on 0G Network ({uploadedFiles.length})
          </h4>
          
          {uploadedFiles.map((file, index) => (
            <div key={index} className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-lg p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatBytes(file.size)} • {file.uploadTimestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-200 transition-colors"
                    title="Download from 0G Storage"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-200 transition-colors"
                    title="View in Explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showAdvancedInfo && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="bg-white rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">Root Hash</span>
                      <button
                        onClick={() => copyToClipboard(file.rootHash)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-gray-600 font-mono break-all">{file.rootHash}</p>
                  </div>
                  
                  {file.txHash && (
                    <div className="bg-white rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-700">TX Hash</span>
                        <button
                          onClick={() => copyToClipboard(file.txHash!)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-gray-600 font-mono break-all">{file.txHash}</p>
                    </div>
                  )}
                  
                  {file.daCommitment && (
                    <div className="bg-white rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-700">DA Commitment</span>
                        <button
                          onClick={() => copyToClipboard(file.daCommitment!)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-gray-600 font-mono break-all">{file.daCommitment}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

