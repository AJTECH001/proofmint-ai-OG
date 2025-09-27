import React, { useState } from 'react';
import { zeroGStorageService } from '../../services/ZeroGStorageService';
import { Download, Search, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ZeroGStorageDownloaderProps {
  onDownloadComplete?: (filename: string, data: Blob) => void;
  className?: string;
}

export const ZeroGStorageDownloader: React.FC<ZeroGStorageDownloaderProps> = ({
  onDownloadComplete,
  className = ''
}) => {
  const [rootHash, setRootHash] = useState('');
  const [filename, setFilename] = useState('');
  const [withProof, setWithProof] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{
    status: 'idle' | 'downloading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const handleDownload = async () => {
    if (!rootHash.trim()) {
      setDownloadStatus({
        status: 'error',
        message: 'Please enter a root hash'
      });
      return;
    }

    setIsDownloading(true);
    setDownloadStatus({ status: 'downloading', message: 'Downloading file...' });

    try {
      const result = await zeroGStorageService.downloadFileEnhanced(
        rootHash.trim(),
        filename.trim() || undefined,
        withProof
      );

      if (result.success && result.data) {
        setDownloadStatus({
          status: 'success',
          message: 'File downloaded successfully!'
        });

        // Create download link
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.trim() || `file_${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (onDownloadComplete) {
          onDownloadComplete(filename.trim() || `file_${Date.now()}`, result.data);
        }
      } else {
        setDownloadStatus({
          status: 'error',
          message: result.error || 'Download failed'
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Download failed'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = () => {
    switch (downloadStatus.status) {
      case 'downloading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (downloadStatus.status) {
      case 'downloading':
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Download className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Download from 0G Storage
            </h3>
          </div>

          {/* Root Hash Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Root Hash *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={rootHash}
                onChange={(e) => setRootHash(e.target.value)}
                placeholder="Enter the root hash of the file to download"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isDownloading}
              />
            </div>
          </div>

          {/* Filename Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename (optional)
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename for downloaded file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isDownloading}
            />
          </div>

          {/* Proof Verification Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="withProof"
              checked={withProof}
              onChange={(e) => setWithProof(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isDownloading}
            />
            <label htmlFor="withProof" className="text-sm text-gray-700">
              Enable cryptographic proof verification
            </label>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || !rootHash.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </>
            )}
          </button>

          {/* Status Message */}
          {downloadStatus.message && (
            <div className={`flex items-center space-x-2 p-3 rounded-md ${
              downloadStatus.status === 'success' ? 'bg-green-50' :
              downloadStatus.status === 'error' ? 'bg-red-50' :
              'bg-blue-50'
            }`}>
              {getStatusIcon()}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {downloadStatus.message}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Download Information</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Root hash is the unique identifier for your file in 0G Storage</li>
          <li>• Proof verification ensures file integrity and authenticity</li>
          <li>• Downloaded files are automatically saved to your device</li>
          <li>• Large files may take longer to download</li>
        </ul>
      </div>
    </div>
  );
};

export default ZeroGStorageDownloader;
