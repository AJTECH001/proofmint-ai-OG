import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useZeroGStorage } from '../../hooks/useZeroGStorage';
import { FileAttachment } from '../../types/contracts';

interface FileUploadProps {
  receiptId?: string;
  onUploadSuccess?: (result: { rootHash: string; metadata?: any }) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  showPreview?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  rootHash?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  receiptId,
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  showPreview = true
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const { uploadFile, uploadReceiptAttachment, isUploading, error, clearError } = useZeroGStorage();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    clearError();
    
    // Add files to uploading state
    const newUploadingFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        let result;
        if (receiptId) {
          result = await uploadReceiptAttachment(file, receiptId);
        } else {
          result = await uploadFile(file);
        }

        if (result.success && result.rootHash) {
          // Update uploading file status to success
          setUploadingFiles(prev => 
            prev.map(uf => 
              uf.file === file 
                ? { ...uf, status: 'success', rootHash: result.rootHash, progress: 100 }
                : uf
            )
          );

          // Add to uploaded files - create attachment from upload result
          const attachment: FileAttachment = {
            id: result.rootHash!,
            name: file.name,
            type: file.type,
            size: file.size,
            rootHash: result.rootHash!,
            transactionHash: result.txHash || 'mock_tx_hash',
            uploadedAt: new Date(),
            uploadedBy: '0x0000000000000000000000000000000000000000' as `0x${string}`,
            isVerified: true
          };
          
          setUploadedFiles(prev => [...prev, attachment]);

          onUploadSuccess?.({ rootHash: result.rootHash! });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        
        // Update uploading file status to error
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file 
              ? { ...uf, status: 'error', error: errorMsg, progress: 0 }
              : uf
          )
        );

        onUploadError?.(errorMsg);
      }
    }
  }, [receiptId, uploadFile, uploadReceiptAttachment, onUploadSuccess, onUploadError, clearError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    disabled: isUploading || uploadedFiles.length >= maxFiles
  });

  const removeUploadingFile = (fileToRemove: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== fileToRemove));
  };

  const removeUploadedFile = (rootHash: string) => {
    setUploadedFiles(prev => prev.filter(f => f.rootHash !== rootHash));
  };

  const downloadFile = async (attachment: FileAttachment) => {
    try {
      // This would trigger download from 0G Storage
      console.log('Downloading file:', attachment.rootHash);
      // Implementation would use the download hook
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
          }
          ${isUploading || uploadedFiles.length >= maxFiles 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
          }
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {isDragActive 
              ? 'Drop files here...' 
              : 'Upload to 0G Storage'
            }
          </p>
          <p className="text-sm text-gray-500">
            Drag & drop files or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Max {maxFiles} files, {formatFileSize(maxSize)} per file
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-red-800">Upload Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploading to 0G Storage...</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadingFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadingFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeUploadingFile(uploadingFile.file)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {uploadingFile.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadingFile.progress}%` }}
                  />
                </div>
              )}

              {uploadingFile.status === 'success' && uploadingFile.rootHash && (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                  <p className="text-green-800">
                    <span className="font-medium">Root Hash:</span> {uploadingFile.rootHash}
                  </p>
                </div>
              )}

              {uploadingFile.status === 'error' && uploadingFile.error && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                  <p className="text-red-800">{uploadingFile.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Stored on 0G Network</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • Uploaded {file.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadFile(file)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Download from 0G Storage"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeUploadedFile(file.rootHash)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {showPreview && (
                <div className="mt-2 p-2 bg-white rounded text-xs border">
                  <p className="text-gray-600 break-all">
                    <span className="font-medium">Root Hash:</span> {file.rootHash}
                  </p>
                  {file.transactionHash && (
                    <p className="text-gray-600 break-all mt-1">
                      <span className="font-medium">Transaction:</span> {file.transactionHash}
                    </p>
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