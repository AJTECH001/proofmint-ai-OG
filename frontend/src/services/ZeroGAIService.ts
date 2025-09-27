import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

export interface ZeroGAIResponse {
  text: string;
  model: string;
  provider: string;
  verified: boolean;
}

export interface ServiceProvider {
  provider: string;
  model: string;
  inputPrice: bigint;
  outputPrice: bigint;
  verifiability: string;
  url: string;
  description?: string;
}

export class ZeroGAIService {
  private broker: any = null;
  private wallet: ethers.Wallet | null = null;
  private isInitialized = false;
  private availableServices: ServiceProvider[] = [];

  // Official 0G Services as documented
  private static readonly OFFICIAL_SERVICES = {
    'llama-3.3-70b-instruct': {
      provider: '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
      description: 'State-of-the-art 70B parameter model for general AI tasks',
      verifiability: 'TEE (TeeML)'
    },
    'deepseek-r1-70b': {
      provider: '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3',
      description: 'Advanced reasoning model optimized for complex problem solving',
      verifiability: 'TEE (TeeML)'
    }
  };

  async initialize(privateKey?: string, rpcUrl: string = "https://evmrpc-testnet.0g.ai"): Promise<void> {
    try {
      if (!privateKey) {
        throw new Error("Private key is required for 0G AI service initialization");
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, provider);
      this.broker = await createZGComputeNetworkBroker(this.wallet);
      
      await this.discoverServices();
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize 0G AI service:", error);
      throw new Error(`0G AI initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async discoverServices(): Promise<ServiceProvider[]> {
    if (!this.broker) {
      throw new Error("Broker not initialized");
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

      return this.availableServices;
    } catch (error) {
      console.error("Failed to discover services:", error);
      throw new Error(`Service discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getServiceDescription(model: string): string {
    const officialService = ZeroGAIService.OFFICIAL_SERVICES[model as keyof typeof ZeroGAIService.OFFICIAL_SERVICES];
    return officialService?.description || `AI model: ${model}`;
  }

  async getBalance(): Promise<{ balance: string; locked: string; available: string }> {
    if (!this.broker) {
      throw new Error("Broker not initialized");
    }

    try {
      const ledger = await this.broker.ledger.getLedger();
      return {
        balance: ethers.formatEther(ledger.balance || 0),
        locked: ethers.formatEther(ledger.locked || 0),
        available: ethers.formatEther((ledger.balance || 0) - (ledger.locked || 0))
      };
    } catch (error) {
      console.error("Failed to get balance:", error);
      throw new Error(`Balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addFunds(amount: string): Promise<void> {
    if (!this.broker) {
      throw new Error("Broker not initialized");
    }

    try {
      await this.broker.ledger.addLedger(amount);
    } catch (error) {
      console.error("Failed to add funds:", error);
      throw new Error(`Failed to add funds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMessage(
    message: string, 
    providerAddress?: string,
    model?: string
  ): Promise<ZeroGAIResponse> {
    if (!this.isInitialized || !this.broker) {
      throw new Error("0G AI service not initialized");
    }

    try {
      // Use default provider if not specified
      const targetProvider = providerAddress || this.getDefaultProvider();
      const targetModel = model || await this.getModelForProvider(targetProvider);

      // Acknowledge provider if not already done
      await this.acknowledgeProvider(targetProvider);

      // Get service metadata and auth headers
      const { endpoint, model: serviceModel } = await this.broker.inference.getServiceMetadata(targetProvider);
      const headers = await this.broker.inference.getRequestHeaders(targetProvider, message);

      // Send request to the service
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...headers 
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          model: serviceModel || targetModel,
          max_tokens: 1000,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from 0G AI service");
      }

      const content = data.choices[0].message.content;
      const chatID = data.id;

      // Process and verify response
      const verified = await this.broker.inference.processResponse(
        targetProvider,
        content,
        chatID
      );

      return {
        text: content,
        model: serviceModel || targetModel,
        provider: targetProvider,
        verified: verified || false
      };

    } catch (error) {
      console.error("Failed to send message:", error);
      throw new Error(`Message sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async acknowledgeProvider(providerAddress: string): Promise<void> {
    try {
      await this.broker.inference.acknowledgeProviderSigner(providerAddress);
    } catch (error) {
      // Provider might already be acknowledged, which is fine
      console.log("Provider acknowledgment:", error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private getDefaultProvider(): string {
    // Return the first available service or default to llama model
    if (this.availableServices.length > 0) {
      return this.availableServices[0].provider;
    }
    return ZeroGAIService.OFFICIAL_SERVICES['llama-3.3-70b-instruct'].provider;
  }

  private async getModelForProvider(providerAddress: string): Promise<string> {
    const service = this.availableServices.find(s => s.provider === providerAddress);
    if (service) {
      return service.model;
    }
    
    // Default to llama model
    return 'llama-3.3-70b-instruct';
  }

  getAvailableServices(): ServiceProvider[] {
    return this.availableServices;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  async retrieveFunds(amount: string): Promise<void> {
    if (!this.broker) {
      throw new Error("Broker not initialized");
    }

    try {
      await this.broker.ledger.retrieveFund("inference", amount);
    } catch (error) {
      console.error("Failed to retrieve funds:", error);
      throw new Error(`Failed to retrieve funds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const zeroGAIService = new ZeroGAIService();