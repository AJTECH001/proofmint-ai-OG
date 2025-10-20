import { ethers } from 'ethers';

/**
 * 0G Compute Network Service
 * Integrates with 0G Compute for AI-powered receipt verification and analysis
 * 
 * Based on: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk
 */

export interface ComputeServiceConfig {
  rpcUrl: string;
  privateKey: string;
  providerAddress?: string;
  model?: string;
}

export interface AIAnalysisRequest {
  receiptData: {
    receiptId: string;
    merchant: string;
    buyer: string;
    amount: number;
    currency: string;
    device: {
      type: string;
      brand: string;
      model: string;
      price: number;
    };
    timestamp: number;
  };
  analysisType: 'fraud' | 'sustainability' | 'verification' | 'general';
}

export interface AIAnalysisResult {
  success: boolean;
  analysis: string;
  model: string;
  provider: string;
  verified: boolean;
  confidence: number;
  processingTime: number;
  error?: string;
}

export interface ServiceProvider {
  provider: string;
  model: string;
  inputPrice: bigint;
  outputPrice: bigint;
  verifiability: string;
  url: string;
  description: string;
}

export class ZeroGComputeService {
  private broker: any = null;
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private isInitialized = false;
  private availableServices: ServiceProvider[] = [];

  // Official 0G Compute Network AI models
  private static readonly OFFICIAL_MODELS = {
    'llama-3.3-70b-instruct': {
      provider: '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
      description: 'State-of-the-art 70B parameter model for general AI tasks',
      verifiability: 'TEE (TeeML)',
      useCase: 'General analysis, fraud detection, sustainability assessment'
    },
    'deepseek-r1-70b': {
      provider: '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3',
      description: 'Advanced reasoning model optimized for complex problem solving',
      verifiability: 'TEE (TeeML)',
      useCase: 'Complex fraud patterns, advanced reasoning, detailed analysis'
    }
  };

  constructor(private config?: ComputeServiceConfig) {
    if (config) {
      this.initialize(config).catch(err => {
        console.error('Auto-initialization failed:', err);
      });
    }
  }

  /**
   * Initialize the 0G Compute Network broker
   * Based on: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk
   */
  async initialize(config: ComputeServiceConfig): Promise<void> {
    try {
      // Initialize provider and wallet
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl || 'https://evmrpc-testnet.0g.ai');
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);

      console.log('Initializing 0G Compute Network broker...');
      console.log('Wallet address:', this.wallet.address);

      // Dynamic import for 0G serving broker
      try {
        const { createZGComputeNetworkBroker } = await import('@0glabs/0g-serving-broker');
        this.broker = await createZGComputeNetworkBroker(this.wallet);
        console.log('✅ 0G Compute Network broker initialized successfully');
      } catch (importError) {
        console.warn('⚠️ 0G serving broker not available, using mock mode:', importError);
        // Create mock broker for development
        this.broker = this.createMockBroker();
      }

      // Discover available AI services
      await this.discoverServices();
      
      this.isInitialized = true;
      console.log(`✅ Found ${this.availableServices.length} AI services`);
    } catch (error) {
      console.error('Failed to initialize 0G Compute service:', error);
      throw new Error(`0G Compute initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Discover available AI services on 0G Compute Network
   */
  async discoverServices(): Promise<ServiceProvider[]> {
    if (!this.broker) {
      throw new Error('Broker not initialized');
    }

    try {
      const services = await this.broker.inference.listService();
      
      this.availableServices = services.map((service: any) => ({
        provider: service.provider,
        model: service.model,
        inputPrice: service.inputPrice,
        outputPrice: service.outputPrice,
        verifiability: service.verifiability,
        url: service.url,
        description: this.getServiceDescription(service.model)
      }));

      console.log('Available AI Services:');
      this.availableServices.forEach(s => {
        console.log(`  - ${s.model} (${s.verifiability})`);
      });

      return this.availableServices;
    } catch (error) {
      console.error('Failed to discover services:', error);
      // Return default services if discovery fails
      return this.getDefaultServices();
    }
  }

  /**
   * Analyze receipt for fraud using 0G Compute AI
   */
  async analyzeFraud(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    const prompt = this.buildFraudAnalysisPrompt(request.receiptData);
    
    const result = await this.runInference(prompt, 'fraud-detection');
    
    return {
      ...result,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Calculate sustainability metrics using 0G Compute AI
   */
  async analyzeSustainability(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    const prompt = this.buildSustainabilityPrompt(request.receiptData);
    
    const result = await this.runInference(prompt, 'sustainability-analysis');
    
    return {
      ...result,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * General AI-powered receipt verification
   */
  async verifyReceipt(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    const prompt = this.buildVerificationPrompt(request.receiptData);
    
    const result = await this.runInference(prompt, 'verification');
    
    return {
      ...result,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Run AI inference on 0G Compute Network
   * Based on: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk
   */
  private async runInference(prompt: string, taskType: string): Promise<AIAnalysisResult> {
    if (!this.isInitialized || !this.broker) {
      return {
        success: false,
        analysis: '',
        model: 'none',
        provider: 'none',
        verified: false,
        confidence: 0,
        processingTime: 0,
        error: '0G Compute service not initialized'
      };
    }

    try {
      // Select provider (default to Llama 3.3 70B)
      const targetProvider = this.config?.providerAddress || 
        ZeroGComputeService.OFFICIAL_MODELS['llama-3.3-70b-instruct'].provider;
      
      const targetModel = this.config?.model || 'llama-3.3-70b-instruct';

      // Acknowledge provider (required for first-time use)
      await this.acknowledgeProvider(targetProvider);

      // Get service metadata and auth headers
      const { endpoint, model: serviceModel } = await this.broker.inference.getServiceMetadata(targetProvider);
      const headers = await this.broker.inference.getRequestHeaders(targetProvider, prompt);

      console.log(`🤖 Running ${taskType} inference on ${serviceModel || targetModel}...`);

      // Make request to 0G Compute AI service
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI assistant for ProofMint, specializing in receipt verification, fraud detection, and sustainability analysis for electronic devices.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: serviceModel || targetModel,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`AI service request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from 0G Compute AI service');
      }

      const content = data.choices[0].message.content;
      const chatID = data.id;

      // Process and verify response with TEE verification
      const verified = await this.broker.inference.processResponse(
        targetProvider,
        content,
        chatID
      );

      console.log(`✅ ${taskType} complete (verified: ${verified})`);

      return {
        success: true,
        analysis: content,
        model: serviceModel || targetModel,
        provider: targetProvider,
        verified: verified || false,
        confidence: this.calculateConfidence(content, verified),
        processingTime: 0
      };

    } catch (error) {
      console.error('AI inference failed:', error);
      return {
        success: false,
        analysis: '',
        model: 'error',
        provider: 'error',
        verified: false,
        confidence: 0,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'AI inference failed'
      };
    }
  }

  /**
   * Acknowledge provider before first use (required by 0G Compute)
   */
  private async acknowledgeProvider(providerAddress: string): Promise<void> {
    try {
      await this.broker.inference.acknowledgeProviderSigner(providerAddress);
    } catch (error) {
      // Provider might already be acknowledged
      console.log('Provider acknowledgment:', error instanceof Error ? error.message : 'Already acknowledged');
    }
  }

  /**
   * Build fraud analysis prompt for AI
   */
  private buildFraudAnalysisPrompt(data: AIAnalysisRequest['receiptData']): string {
    return `Analyze this electronic device receipt for potential fraud indicators:

Receipt Details:
- Receipt ID: ${data.receiptId}
- Merchant: ${data.merchant}
- Buyer: ${data.buyer}
- Transaction Amount: ${data.currency} ${data.amount}
- Device: ${data.device.brand} ${data.device.model} (${data.device.type})
- Device Price: ${data.currency} ${data.device.price}
- Transaction Date: ${new Date(data.timestamp).toISOString()}

Please analyze for:
1. Price anomalies (compare to typical market price for this device)
2. Suspicious patterns in merchant/buyer addresses
3. Timing inconsistencies
4. Device specification verification
5. Overall fraud risk assessment

Provide a JSON response with:
{
  "isFraudulent": boolean,
  "riskScore": 0-100,
  "confidence": 0-1,
  "reasons": ["reason1", "reason2"],
  "recommendation": "approve" | "review" | "reject"
}

Then provide a detailed explanation.`;
  }

  /**
   * Build sustainability analysis prompt for AI
   */
  private buildSustainabilityPrompt(data: AIAnalysisRequest['receiptData']): string {
    return `Analyze the environmental impact and sustainability of this electronic device:

Device Information:
- Type: ${data.device.type}
- Brand: ${data.device.brand}
- Model: ${data.device.model}
- Purchase Date: ${new Date(data.timestamp).toISOString()}

Please provide a comprehensive sustainability assessment:
1. Estimated carbon footprint (in kg CO2eq)
2. Recyclability score (0-100)
3. Eco rating (A-E scale)
4. Expected device lifespan
5. Recycling recommendations
6. Key sustainability concerns

Provide a JSON response with:
{
  "carbonFootprint": "X kg CO2eq",
  "recyclabilityScore": 0-100,
  "ecoRating": "A" | "B" | "C" | "D" | "E",
  "expectedLifespan": "X years",
  "recyclingRecommendations": ["rec1", "rec2"],
  "sustainabilityFlags": ["flag1", "flag2"]
}

Then provide detailed reasoning.`;
  }

  /**
   * Build verification prompt for AI
   */
  private buildVerificationPrompt(data: AIAnalysisRequest['receiptData']): string {
    return `Verify this electronic device receipt for authenticity and completeness:

Receipt: ${data.receiptId}
Device: ${data.device.brand} ${data.device.model}
Amount: ${data.currency} ${data.amount}
Merchant: ${data.merchant}

Please verify:
1. Device specifications match known models
2. Price is reasonable for this device
3. All required information is present
4. No obvious red flags or inconsistencies

Provide verification result with confidence level.`;
  }

  /**
   * Calculate confidence based on AI response
   */
  private calculateConfidence(response: string, verified: boolean): number {
    // Base confidence on TEE verification
    let confidence = verified ? 0.9 : 0.6;
    
    // Adjust based on response clarity
    if (response.includes('confidence') || response.includes('certain')) {
      confidence += 0.05;
    }
    if (response.includes('likely') || response.includes('probable')) {
      confidence += 0.03;
    }
    
    return Math.min(confidence, 0.99);
  }

  /**
   * Get service description
   */
  private getServiceDescription(model: string): string {
    const officialModel = ZeroGComputeService.OFFICIAL_MODELS[model as keyof typeof ZeroGComputeService.OFFICIAL_MODELS];
    return officialModel?.description || `AI model: ${model}`;
  }

  /**
   * Get default services (fallback)
   */
  private getDefaultServices(): ServiceProvider[] {
    return [
      {
        provider: ZeroGComputeService.OFFICIAL_MODELS['llama-3.3-70b-instruct'].provider,
        model: 'llama-3.3-70b-instruct',
        inputPrice: BigInt(0),
        outputPrice: BigInt(0),
        verifiability: 'TEE (TeeML)',
        url: 'https://0g.ai',
        description: ZeroGComputeService.OFFICIAL_MODELS['llama-3.3-70b-instruct'].description
      },
      {
        provider: ZeroGComputeService.OFFICIAL_MODELS['deepseek-r1-70b'].provider,
        model: 'deepseek-r1-70b',
        inputPrice: BigInt(0),
        outputPrice: BigInt(0),
        verifiability: 'TEE (TeeML)',
        url: 'https://0g.ai',
        description: ZeroGComputeService.OFFICIAL_MODELS['deepseek-r1-70b'].description
      }
    ];
  }

  /**
   * Create mock broker for development
   */
  private createMockBroker(): any {
    return {
      inference: {
        listService: async () => [],
        getServiceMetadata: async () => ({ endpoint: 'mock', model: 'mock' }),
        getRequestHeaders: async () => ({}),
        acknowledgeProviderSigner: async () => {},
        processResponse: async () => false
      }
    };
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get available AI models
   */
  getAvailableModels(): ServiceProvider[] {
    return this.availableServices;
  }

  /**
   * Get balance information
   */
  async getBalance(): Promise<{ balance: string; locked: string; available: string }> {
    if (!this.broker) {
      throw new Error('Broker not initialized');
    }

    try {
      const ledger = await this.broker.ledger.getLedger();
      return {
        balance: ethers.formatEther(ledger.balance || 0),
        locked: ethers.formatEther(ledger.locked || 0),
        available: ethers.formatEther((ledger.balance || 0) - (ledger.locked || 0))
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }
}

// Singleton instance
let computeServiceInstance: ZeroGComputeService | null = null;

export const getZeroGComputeService = (): ZeroGComputeService => {
  if (!computeServiceInstance) {
    computeServiceInstance = new ZeroGComputeService();
  }
  return computeServiceInstance;
};

export const initializeZeroGCompute = async (config: ComputeServiceConfig): Promise<ZeroGComputeService> => {
  const service = getZeroGComputeService();
  await service.initialize(config);
  return service;
};

