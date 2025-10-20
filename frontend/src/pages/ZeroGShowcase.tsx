import React, { useState } from 'react';
import { Enhanced0GStorageUpload } from '../components/storage/Enhanced0GStorageUpload';
import { 
  Database, 
  Cpu, 
  Network, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'storage',
    label: '0G Storage',
    icon: <Database className="h-5 w-5" />,
    description: 'Decentralized storage with cryptographic proofs'
  },
  {
    id: 'da',
    label: '0G DA',
    icon: <Network className="h-5 w-5" />,
    description: 'Data Availability layer for immutable records'
  },
  {
    id: 'compute',
    label: '0G Compute',
    icon: <Cpu className="h-5 w-5" />,
    description: 'AI-powered fraud detection and analysis'
  },
  {
    id: 'inft',
    label: 'INFTs',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Intelligent NFTs with dynamic traits'
  }
];

export const ZeroGShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('storage');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Globe className="h-12 w-12 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              ProofMint <span className="text-green-600">× 0G</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the full power of 0G's modular AI infrastructure integrated into ProofMint's 
            sustainable receipts-as-a-service platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg border-2 border-green-200 p-6 text-center">
            <Database className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">0G Storage</h3>
            <p className="text-sm text-gray-600">10-100x cheaper than traditional storage</p>
          </div>
          <div className="bg-white rounded-lg border-2 border-blue-200 p-6 text-center">
            <Network className="h-10 w-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">0G DA</h3>
            <p className="text-sm text-gray-600">Immutable data availability layer</p>
          </div>
          <div className="bg-white rounded-lg border-2 border-purple-200 p-6 text-center">
            <Cpu className="h-10 w-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">0G Compute</h3>
            <p className="text-sm text-gray-600">AI-powered verification & analysis</p>
          </div>
          <div className="bg-white rounded-lg border-2 border-pink-200 p-6 text-center">
            <Sparkles className="h-10 w-10 text-pink-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">INFTs</h3>
            <p className="text-sm text-gray-600">Dynamic, intelligent NFTs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {/* 0G Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    0G Decentralized Storage Integration
                  </h2>
                  <p className="text-gray-600">
                    Upload files directly to 0G Storage network with cryptographic verification. 
                    All files are stored with Merkle proof verification for maximum integrity.
                  </p>
                </div>

                <Enhanced0GStorageUpload
                  onUploadComplete={(files) => {
                    setUploadedFiles(files);
                  }}
                  maxFiles={10}
                  maxFileSize={50 * 1024 * 1024}
                  showAdvancedInfo={true}
                />

                {/* Storage Features */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Shield className="h-6 w-6 text-green-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Cryptographic Proof</h4>
                    <p className="text-sm text-gray-600">
                      Every upload gets a Merkle tree root hash for verification
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Zap className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Lightning Fast</h4>
                    <p className="text-sm text-gray-600">
                      Parallel uploads with optimized node selection
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Database className="h-6 w-6 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Permanent Storage</h4>
                    <p className="text-sm text-gray-600">
                      Files stored permanently on decentralized network
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 0G DA Tab */}
            {activeTab === 'da' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    0G Data Availability Layer
                  </h2>
                  <p className="text-gray-600">
                    Every ProofMint receipt is linked to the 0G DA layer, ensuring data is always 
                    available and verifiable. DA commitments provide cryptographic proof of data publication.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How DA Integration Works</h3>
                  <div className="space-y-4">
                    {[
                      {
                        step: '1',
                        title: 'Receipt Issuance',
                        description: 'Merchant issues receipt NFT on 0G Chain'
                      },
                      {
                        step: '2',
                        title: 'DA Submission',
                        description: 'Complete receipt metadata submitted to 0G DA layer'
                      },
                      {
                        step: '3',
                        title: 'Commitment Linking',
                        description: 'DA commitment hash linked to smart contract on-chain'
                      },
                      {
                        step: '4',
                        title: 'Verification',
                        description: 'Anyone can verify receipt data availability using commitment'
                      }
                    ].map((item) => (
                      <div key={item.step} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {item.step}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">DA Benefits for ProofMint</h3>
                  <ul className="space-y-3">
                    {[
                      'Immutable record of all receipt transactions',
                      'Cryptographic proof of data publication',
                      'Scalable data availability without blockchain bloat',
                      'Fast retrieval with Merkle proof verification',
                      'Support for receipts up to 31MB of metadata'
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 0G Compute Tab */}
            {activeTab === 'compute' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    0G Compute AI Integration
                  </h2>
                  <p className="text-gray-600">
                    ProofMint uses 0G Compute for AI-powered fraud detection, sustainability scoring, 
                    and receipt verification. All AI inference is verifiable and runs on decentralized infrastructure.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                    <Cpu className="h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Fraud Detection AI
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Multi-factor fraud analysis using AI models running on 0G Compute network
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                        <span>Price anomaly detection</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                        <span>Duplicate receipt identification</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                        <span>Merchant verification</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                        <span>Metadata consistency checks</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                    <Sparkles className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Sustainability AI
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      AI-powered environmental impact analysis for every device
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span>Carbon footprint calculation</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span>Recyclability scoring (0-100)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span>Eco-rating assessment (A-E)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span>Recycling recommendations</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available AI Models</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Llama 3.3 70B</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        State-of-the-art model for general AI tasks and analysis
                      </p>
                      <span className="inline-block text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        TEE (TeeML) Verified
                      </span>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">DeepSeek R1 70B</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Advanced reasoning for complex fraud detection
                      </p>
                      <span className="inline-block text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        TEE (TeeML) Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INFT Tab */}
            {activeTab === 'inft' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Intelligent NFTs (INFTs) with ERC-7857
                  </h2>
                  <p className="text-gray-600">
                    ProofMint receipts are Intelligent NFTs that evolve over time. Each receipt can store 
                    an AI agent on 0G Storage and has dynamic traits that change based on device lifecycle.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dynamic INFT Traits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        trait: 'AI Agent CID',
                        description: 'Store AI model/weights on 0G Storage',
                        example: 'QmYwAPJzv5CZsnA621...'
                      },
                      {
                        trait: 'Recyclability Score',
                        description: 'Increases as device ages (0-100)',
                        example: '75 → 80 → 85'
                      },
                      {
                        trait: 'Carbon Credits',
                        description: 'Accumulated through sustainable actions',
                        example: '150 ETH equivalent'
                      },
                      {
                        trait: 'Recycling Eligible',
                        description: 'Auto-updates based on age/warranty',
                        example: 'true after 2 years'
                      }
                    ].map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.trait}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                          {item.example}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">INFT Lifecycle</h3>
                  <div className="space-y-4">
                    {[
                      {
                        phase: 'Day 0: Issuance',
                        traits: 'Initial recyclability & sustainability scores set'
                      },
                      {
                        phase: 'Year 1: Warranty Period',
                        traits: 'Warranty countdown, device age tracking'
                      },
                      {
                        phase: 'Year 2: Aging',
                        traits: 'Recyclability score increases, recycling eligibility activated'
                      },
                      {
                        phase: 'Recycling: Carbon Credits',
                        traits: 'Recyclers award carbon credits, sustainability value increases'
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <Sparkles className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.phase}</h4>
                          <p className="text-sm text-gray-600">{item.traits}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ERC-7857 Compatibility
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ProofMint implements the ERC-7857 standard for Intelligent NFTs, making receipts 
                    interoperable with other INFT platforms on 0G ecosystem.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {[
                      'getAgentCID() - Retrieve AI agent from 0G Storage',
                      'updateAIAgent() - NFT owners can upgrade their AI',
                      'Dynamic trait updates via updateINFTTraits()',
                      'Carbon credit system via awardCarbonCredits()'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700 font-mono text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{uploadedFiles.length}</p>
                <p className="text-sm text-gray-600">Files Uploaded</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {uploadedFiles.filter(f => f.rootHash).length}
                </p>
                <p className="text-sm text-gray-600">Verified on 0G</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">100%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-600">
                  {(uploadedFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-gray-600">Total Size</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

