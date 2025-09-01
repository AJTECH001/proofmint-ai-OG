import React, { useState, useEffect } from 'react';
import { Download, Eye, Trash2, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useZeroGStorage } from '../../hooks/useZeroGStorage';
import { FileAttachment, ReceiptStorageMetadata } from '../../types/contracts';

interface StorageViewerProps {
  receiptId: string;
  onFileDeleted?: (rootHash: string) => void;
  onFileDownloaded?: (file: FileAttachment) => void;
  showActions?: boolean;
}

export const StorageViewer: React.FC<StorageViewerProps> = ({
  receiptId,
  onFileDeleted,
  onFileDownloaded,
  showActions = true
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [storageMetadata, setStorageMetadata] = useState<ReceiptStorageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  const { getReceiptAttachments, downloadFile, downloadFileWithProof, error } = useZeroGStorage();

  useEffect(() => {
    loadAttachments();
  }, [receiptId]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const files = await getReceiptAttachments(receiptId);
      // Convert FileMetadata to FileAttachment
      const attachments = files.map(file => ({
        id: file.rootHash,
        name: file.name,
        type: file.type,
        size: file.size,
        rootHash: file.rootHash,
        transactionHash: file.transactionHash,
        uploadedAt: file.uploadedAt,
        uploadedBy: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        isVerified: true
      }));
      setAttachments(attachments);
      
      // Mock storage metadata - in real implementation this would come from the service
      setStorageMetadata({
        mainDocumentHash: files[0]?.rootHash,
        attachmentHashes: files.map(f => f.rootHash),
        totalStorageSize: files.reduce((total, f) => total + f.size, 0),
        storageNodes: ['node1.0g.ai', 'node2.0g.ai'], // Mock data
        verificationStatus: 'verified',
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to load attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileAttachment, withProof = false) => {
    setDownloading(file.rootHash);
    try {
      const result = withProof 
        ? await downloadFileWithProof(file.rootHash, file.name)
        : await downloadFile(file.rootHash, file.name);
      
      if (result.success && result.data) {
        // Create download link
        const url = URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        onFileDownloaded?.(file);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = (file: FileAttachment) => {
    // In a real implementation, this would remove the file reference from storage metadata
    setAttachments(prev => prev.filter(f => f.rootHash !== file.rootHash));
    onFileDeleted?.(file.rootHash);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    return '📁';
  };

  const getVerificationIcon = (file: FileAttachment) => {
    if (file.isVerified) {
      return (
        <div title="Verified on 0G Storage">
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
      );
    }
    return (
      <div title="Verification pending">
        <Clock className="h-4 w-4 text-yellow-500" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Eye className="mx-auto h-12 w-12 mb-4 text-gray-300" />
        <p>No files stored on 0G Storage</p>
        <p className="text-sm mt-1">Upload files to store them permanently on the decentralized network</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      {storageMetadata && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              0G Storage Overview
            </h3>
            <div className="flex items-center space-x-1">
              {storageMetadata.verificationStatus === 'verified' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {storageMetadata.verificationStatus === 'pending' && (
                <Clock className="h-5 w-5 text-yellow-500" />
              )}
              {storageMetadata.verificationStatus === 'failed' && (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Files</p>
              <p className="font-medium">{attachments.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Size</p>
              <p className="font-medium">{formatFileSize(storageMetadata.totalStorageSize)}</p>
            </div>
            <div>
              <p className="text-gray-500">Storage Nodes</p>
              <p className="font-medium">{storageMetadata.storageNodes.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="font-medium">{storageMetadata.lastUpdated.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-red-800">Storage Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Stored Files</h4>
        
        {attachments.map((file) => (
          <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="text-2xl">{getFileIcon(file.type)}</div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    {getVerificationIcon(file)}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.uploadedAt.toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-mono truncate max-w-24" title={file.rootHash}>
                      {file.rootHash.slice(0, 8)}...{file.rootHash.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
              
              {showActions && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDownload(file, false)}
                    disabled={downloading === file.rootHash}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Download file"
                  >
                    {downloading === file.rootHash ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDownload(file, true)}
                    disabled={downloading === file.rootHash}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Download with cryptographic proof"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove reference"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Additional metadata */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Root Hash:</span>
                  <div className="font-mono mt-1 p-2 bg-gray-50 rounded text-xs break-all">
                    {file.rootHash}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Transaction:</span>
                  <div className="font-mono mt-1 p-2 bg-gray-50 rounded text-xs break-all">
                    {file.transactionHash}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};