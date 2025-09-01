import React, { useState } from 'react';
import { FileUpload } from '../storage/FileUpload';
import { StorageViewer } from '../storage/StorageViewer';
import { useZeroGStorage } from '../../hooks/useZeroGStorage';
import { AlertCircle, CheckCircle, Info, Upload, Download, Shield } from 'lucide-react';

/**
 * Example component demonstrating 0G Storage integration
 * This shows how to use file upload, viewing, and management features
 */
export const ZeroGStorageExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'view' | 'info'>('info');
  const [selectedReceiptId, setSelectedReceiptId] = useState('example-receipt-001');
  
  const { 
    isConfigured, 
    error, 
    isUploading, 
    isDownloading,
    uploadProgress,
    writeKV,
    readKV 
  } = useZeroGStorage();

  const handleUploadSuccess = (result: { rootHash: string; metadata?: any }) => {
    console.log('File uploaded successfully:', result);
    // Switch to view tab to see the uploaded file
    setActiveTab('view');
  };

  const handleKVWrite = async () => {
    try {
      const result = await writeKV(1, {
        'example-key-1': 'Example value 1',
        'example-key-2': 'Example value 2',
        [`receipt:${selectedReceiptId}:metadata`]: JSON.stringify({
          description: 'Example receipt',
          category: 'electronics',
          timestamp: Date.now()
        })
      });
      
      if (result.success) {
        console.log('KV write successful:', result.transactionHash);
      }
    } catch (error) {
      console.error('KV write failed:', error);
    }
  };

  const handleKVRead = async () => {
    try {
      const result = await readKV(1, [
        'example-key-1',
        'example-key-2',
        `receipt:${selectedReceiptId}:metadata`
      ]);
      
      if (result.success) {
        console.log('KV read successful:', result.data);
      }
    } catch (error) {
      console.error('KV read failed:', error);
    }
  };

  const renderInfoTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="h-6 w-6 text-blue-600 mt-1 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              0G Storage Integration Demo
            </h3>
            <p className="text-blue-800 mb-4">
              This example demonstrates how ProofMint integrates with 0G Storage for decentralized file management.
            </p>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Upload files to 0G Storage network with progress tracking</p>
              <p>• Download files with optional cryptographic proof verification</p>
              <p>• Store and retrieve metadata using KV store</p>
              <p>• Associate files with specific receipts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className={`border rounded-lg p-4 ${
        isConfigured 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start">
          {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
          )}
          <div>
            <h4 className={`font-medium ${
              isConfigured ? 'text-green-800' : 'text-yellow-800'
            }`}>
              Configuration Status
            </h4>
            <p className={`text-sm mt-1 ${
              isConfigured ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {isConfigured 
                ? '0G Storage is properly configured and ready to use'
                : 'Configure 0G Storage settings in your environment variables'
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* KV Store Demo */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">KV Store Operations</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt ID
            </label>
            <input
              type="text"
              value={selectedReceiptId}
              onChange={(e) => setSelectedReceiptId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter receipt ID"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleKVWrite}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write KV Data
            </button>
            <button
              onClick={handleKVRead}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Read KV Data
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            Check the browser console for KV operation results
          </p>
        </div>
      </div>
    </div>
  );

  const renderUploadTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Upload className="h-5 w-5 mr-2 text-green-600" />
          File Upload Example
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Upload files to 0G Storage network. Files will be associated with the receipt ID: 
          <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-1">{selectedReceiptId}</span>
        </p>
      </div>

      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <div className="flex-1">
              <p className="font-medium text-blue-800">Uploading to 0G Storage...</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <FileUpload
        receiptId={selectedReceiptId}
        onUploadSuccess={handleUploadSuccess}
        maxFiles={3}
        maxSize={5 * 1024 * 1024} // 5MB for demo
        acceptedTypes={['image/*', 'application/pdf', '.txt', '.doc', '.docx']}
        showPreview={true}
      />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Upload Features</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Drag & drop or click to select files</p>
          <p>• Real-time upload progress tracking</p>
          <p>• Automatic file validation (type and size)</p>
          <p>• Root hash generation for blockchain storage</p>
          <p>• Metadata storage in KV store</p>
        </div>
      </div>
    </div>
  );

  const renderViewTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-600" />
          Storage Viewer Example
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          View and manage files stored on 0G Storage for receipt: 
          <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-1">{selectedReceiptId}</span>
        </p>
      </div>

      {isDownloading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Download className="h-5 w-5 text-green-600 mr-3" />
            <p className="font-medium text-green-800">Downloading from 0G Storage...</p>
          </div>
        </div>
      )}

      <StorageViewer
        receiptId={selectedReceiptId}
        showActions={true}
        onFileDownloaded={(file) => {
          console.log('Downloaded file:', file);
        }}
        onFileDeleted={(rootHash) => {
          console.log('Deleted file reference:', rootHash);
        }}
      />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Viewer Features</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Display all files associated with a receipt</p>
          <p>• Download files directly from 0G network</p>
          <p>• Cryptographic proof verification option</p>
          <p>• File metadata and transaction tracking</p>
          <p>• Storage node redundancy information</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          0G Storage Integration Example
        </h1>
        <p className="text-gray-600">
          Explore how ProofMint integrates with 0G Storage for decentralized file management
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'view'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            View Files
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && renderInfoTab()}
      {activeTab === 'upload' && renderUploadTab()}
      {activeTab === 'view' && renderViewTab()}
    </div>
  );
};