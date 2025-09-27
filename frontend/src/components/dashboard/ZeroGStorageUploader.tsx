import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { zeroGStorageService, UploadResponse, BatchUploadResponse, StorageLayer } from '../../services/ZeroGStorageService';
import { Upload, Download, Database, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ZeroGStorageUploaderProps {
  onUploadComplete?: (result: UploadResponse) => void;
  onBatchUploadComplete?: (result: BatchUploadResponse) => void;
  storageLayer?: 'log' | 'kv';
  enableBatchUpload?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[];
  className?: string;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadResponse;
}

export const ZeroGStorageUploader: React.FC<ZeroGStorageUploaderProps> = ({
  onUploadComplete,
  onBatchUploadComplete,
  storageLayer = 'log',
  enableBatchUpload = true,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedFileTypes = ['image/*', 'application/pdf', 'text/*', 'application/json'],
  className = ''
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [storageLayers, setStorageLayers] = useState<StorageLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<'log' | 'kv'>(storageLayer);
  const [nodeSelection, setNodeSelection] = useState<{ segmentNumber: number; expectedReplicas: number }>({
    segmentNumber: 1,
    expectedReplicas: 3
  });

  // Load storage layers on component mount
  React.useEffect(() => {
    const loadStorageLayers = async () => {
      try {
        const response = await zeroGStorageService.getStorageLayers();
        if (response.success) {
          setStorageLayers(response.layers);
        }
      } catch (error) {
        console.error('Failed to load storage layers:', error);
      }
    };
    loadStorageLayers();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    
    // Initialize progress tracking
    const progress: UploadProgress[] = acceptedFiles.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'pending'
    }));
    setUploadProgress(progress);

    try {
      if (acceptedFiles.length === 1 && !enableBatchUpload) {
        // Single file upload
        const file = acceptedFiles[0];
        const index = progress.findIndex(p => p.filename === file.name);
        
        // Update progress to uploading
        setUploadProgress(prev => prev.map((p, i) => 
          i === index ? { ...p, status: 'uploading', progress: 50 } : p
        ));

        let result: UploadResponse;
        
        if (selectedLayer === 'log') {
          result = await zeroGStorageService.uploadToLogLayer(file);
        } else {
          result = await zeroGStorageService.uploadFileEnhanced(
            file, 
            nodeSelection.segmentNumber, 
            nodeSelection.expectedReplicas
          );
        }

        // Update progress with result
        setUploadProgress(prev => prev.map((p, i) => 
          i === index ? { 
            ...p, 
            status: result.success ? 'success' : 'error',
            progress: 100,
            error: result.error,
            result
          } : p
        ));

        if (result.success && onUploadComplete) {
          onUploadComplete(result);
        }
      } else {
        // Batch upload
        const result = await zeroGStorageService.batchUploadFiles(
          acceptedFiles,
          nodeSelection.segmentNumber,
          nodeSelection.expectedReplicas
        );

        // Update progress with batch results
        setUploadProgress(prev => prev.map(p => {
          const fileResult = result.results.find(r => 
            acceptedFiles.find(f => f.name === p.filename)
          );
          return {
            ...p,
            status: fileResult?.success ? 'success' : 'error',
            progress: 100,
            error: fileResult?.error,
            result: fileResult
          };
        }));

        if (onBatchUploadComplete) {
          onBatchUploadComplete(result);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      })));
    } finally {
      setIsUploading(false);
    }
  }, [selectedLayer, nodeSelection, enableBatchUpload, onUploadComplete, onBatchUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize,
    accept: allowedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    disabled: isUploading
  });

  const resetUploads = () => {
    setUploadProgress([]);
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'uploading':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Storage Layer Selection */}
      {storageLayers.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Storage Layer
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storageLayers.map((layer) => (
              <div
                key={layer.type}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedLayer === layer.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedLayer(layer.type)}
              >
                <div className="flex items-center space-x-3">
                  {layer.type === 'log' ? (
                    <Database className="w-6 h-6 text-blue-500" />
                  ) : (
                    <FileText className="w-6 h-6 text-green-500" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 capitalize">
                      {layer.type === 'log' ? 'Log Layer' : 'Key-Value Layer'}
                    </h3>
                    <p className="text-sm text-gray-600">{layer.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node Selection Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Segment Number
          </label>
          <input
            type="number"
            min="1"
            value={nodeSelection.segmentNumber}
            onChange={(e) => setNodeSelection(prev => ({
              ...prev,
              segmentNumber: parseInt(e.target.value) || 1
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Replicas
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={nodeSelection.expectedReplicas}
            onChange={(e) => setNodeSelection(prev => ({
              ...prev,
              expectedReplicas: parseInt(e.target.value) || 3
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : isUploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <Upload className="w-full h-full" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading
                ? 'Uploading files...'
                : isDragActive
                ? 'Drop files here'
                : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedLayer === 'log' ? 'Immutable storage' : 'Mutable storage'} • 
              Max {maxFiles} files • 
              Max {Math.round(maxFileSize / (1024 * 1024))}MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Upload Progress</h3>
            <button
              onClick={resetUploads}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-2">
            {uploadProgress.map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(file.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.filename}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                  {file.result?.rootHash && (
                    <p className="text-xs text-gray-500 mt-1">
                      Hash: {file.result.rootHash}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getStatusColor(file.status)}`}>
                    {file.status}
                  </span>
                  {file.status === 'uploading' && (
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZeroGStorageUploader;
