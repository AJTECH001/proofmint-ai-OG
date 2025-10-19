import { ZeroGStorageService } from './ZeroGStorageService';
import { ethers } from 'ethers';

export interface ReceiptData {
  receiptId: string;
  merchant: string;
  buyer: string;
  amount: number;
  currency: string;
  timestamp: number;
  device: {
    type: string;
    brand: string;
    model: string;
    price: number;
  };
  imageHash?: string;
  metadata?: any;
}

export interface FraudAnalysis {
  isFraudulent: boolean;
  riskScore: number; // 0-100
  confidence: number; // 0-1
  reasons: string[];
  flags: FraudFlag[];
  recommendation: 'approve' | 'review' | 'reject';
  aiAnalysis?: string;
  timestamp: number;
}

export interface FraudFlag {
  type: 'price_anomaly' | 'duplicate' | 'merchant_suspicious' | 'timing_suspicious' | 'image_manipulated' | 'metadata_inconsistent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details?: any;
}

export interface SustainabilityMetrics {
  carbonFootprint: string; // e.g., "4.2kg CO2eq"
  recyclabilityScore: number; // 0-100
  ecoRating: 'A' | 'B' | 'C' | 'D' | 'E';
  expectedLifespan: string;
  recyclingRecommendations: string[];
  sustainabilityFlags: string[];
}

export interface PriceVerification {
  isReasonable: boolean;
  marketPrice: number;
  priceDeviation: number; // percentage
  source: string;
  confidence: number;
}

export class FraudDetectionService {
  private priceDatabase: Map<string, number>; // Simple in-memory price database
  private suspiciousMerchants: Set<string>;
  // Reserved for future use
  // private storageService: ZeroGStorageService;
  // private knownFraudPatterns: FraudPattern[];

  constructor() {
    // this.storageService = new ZeroGStorageService();
    this.priceDatabase = new Map();
    this.suspiciousMerchants = new Set();
    // this.knownFraudPatterns = this.initializeFraudPatterns();
    this.initializeFraudPatterns(); // Initialize patterns for future use
    this.initializePriceDatabase();
  }

  /**
   * Main fraud detection analysis using multiple AI and rule-based checks
   */
  async analyzeReceipt(receiptData: ReceiptData): Promise<FraudAnalysis> {
    console.log(`Analyzing receipt ${receiptData.receiptId} for fraud...`);

    const flags: FraudFlag[] = [];
    const reasons: string[] = [];
    let riskScore = 0;

    // 1. Price Anomaly Detection
    const priceCheck = await this.detectPriceAnomaly(receiptData);
    if (!priceCheck.isReasonable) {
      flags.push({
        type: 'price_anomaly',
        severity: priceCheck.priceDeviation > 50 ? 'high' : 'medium',
        description: `Price deviates ${priceCheck.priceDeviation.toFixed(1)}% from market average`,
        details: priceCheck
      });
      reasons.push(`Price is ${priceCheck.priceDeviation.toFixed(1)}% ${priceCheck.priceDeviation > 0 ? 'above' : 'below'} market value`);
      riskScore += priceCheck.priceDeviation > 50 ? 25 : 15;
    }

    // 2. Duplicate Detection
    const duplicateCheck = await this.detectDuplicate(receiptData);
    if (duplicateCheck.isDuplicate) {
      flags.push({
        type: 'duplicate',
        severity: 'high',
        description: 'Potential duplicate receipt detected',
        details: duplicateCheck
      });
      reasons.push('Similar receipt already exists in system');
      riskScore += 30;
    }

    // 3. Merchant Verification
    const merchantCheck = this.verifyMerchant(receiptData.merchant);
    if (!merchantCheck.isTrusted) {
      flags.push({
        type: 'merchant_suspicious',
        severity: merchantCheck.riskLevel as 'low' | 'medium' | 'high',
        description: merchantCheck.reason,
        details: merchantCheck
      });
      reasons.push(merchantCheck.reason);
      riskScore += merchantCheck.riskLevel === 'high' ? 20 : 10;
    }

    // 4. Timing Analysis
    const timingCheck = this.analyzeTimingPatterns(receiptData);
    if (timingCheck.isSuspicious) {
      flags.push({
        type: 'timing_suspicious',
        severity: 'medium',
        description: timingCheck.reason,
        details: timingCheck
      });
      reasons.push(timingCheck.reason);
      riskScore += 15;
    }

    // 5. Metadata Consistency Check
    const metadataCheck = this.validateMetadata(receiptData);
    if (!metadataCheck.isConsistent) {
      flags.push({
        type: 'metadata_inconsistent',
        severity: 'medium',
        description: 'Metadata contains inconsistencies',
        details: metadataCheck.issues
      });
      reasons.push('Receipt metadata has inconsistencies');
      riskScore += 10;
    }

    // 6. AI-Powered Analysis (if 0G Compute is available)
    let aiAnalysis = 'AI analysis not available';
    try {
      aiAnalysis = await this.performAIAnalysis(receiptData);
      // Parse AI response for additional insights
      if (aiAnalysis.toLowerCase().includes('fraud') || aiAnalysis.toLowerCase().includes('suspicious')) {
        riskScore += 15;
        reasons.push('AI detected suspicious patterns');
      }
    } catch (error) {
      console.warn('AI analysis failed:', error);
    }

    // Calculate final metrics
    riskScore = Math.min(riskScore, 100);
    const isFraudulent = riskScore >= 70;
    const confidence = this.calculateConfidence(flags);
    const recommendation = this.getRecommendation(riskScore, flags);

    return {
      isFraudulent,
      riskScore,
      confidence,
      reasons,
      flags,
      recommendation,
      aiAnalysis,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate sustainability metrics using AI
   */
  async calculateSustainabilityMetrics(deviceInfo: ReceiptData['device']): Promise<SustainabilityMetrics> {
    console.log(`Calculating sustainability metrics for ${deviceInfo.brand} ${deviceInfo.model}...`);

    // Use AI to analyze device sustainability
    try {
      const prompt = `Analyze the environmental impact and sustainability of this device:
      Type: ${deviceInfo.type}
      Brand: ${deviceInfo.brand}
      Model: ${deviceInfo.model}
      
      Please provide:
      1. Estimated carbon footprint (in kg CO2eq)
      2. Recyclability score (0-100)
      3. Eco rating (A-E)
      4. Expected lifespan
      5. Recycling recommendations
      6. Key sustainability concerns
      
      Format your response as JSON.`;

      const aiResult = await this.performAIAnalysis({ prompt } as any);
      
      // Parse AI response (with fallback to defaults)
      return this.parseSustainabilityResponse(aiResult, deviceInfo);
    } catch (error) {
      console.error('Sustainability analysis failed:', error);
      return this.getDefaultSustainabilityMetrics(deviceInfo);
    }
  }

  /**
   * Detect price anomalies by comparing with market data
   */
  private async detectPriceAnomaly(receiptData: ReceiptData): Promise<PriceVerification> {
    const deviceKey = `${receiptData.device.brand}_${receiptData.device.model}`.toLowerCase();
    const marketPrice = this.priceDatabase.get(deviceKey) || receiptData.device.price;
    
    if (marketPrice === 0) {
      return {
        isReasonable: true,
        marketPrice: receiptData.device.price,
        priceDeviation: 0,
        source: 'no_data',
        confidence: 0.3
      };
    }

    const priceDeviation = ((receiptData.device.price - marketPrice) / marketPrice) * 100;
    const isReasonable = Math.abs(priceDeviation) < 30; // 30% threshold

    return {
      isReasonable,
      marketPrice,
      priceDeviation,
      source: 'internal_database',
      confidence: 0.8
    };
  }

  /**
   * Detect duplicate receipts
   */
  private async detectDuplicate(_receiptData: ReceiptData): Promise<{ isDuplicate: boolean; similarity: number; matchedReceipt?: string }> {
    // In a real implementation, this would query a database
    // For now, we'll do basic checks
    
    // Check if same device purchased by same buyer from same merchant recently
    const isDuplicate = false; // Placeholder
    
    return {
      isDuplicate,
      similarity: 0
    };
  }

  /**
   * Verify merchant trustworthiness
   */
  private verifyMerchant(merchantAddress: string): { isTrusted: boolean; riskLevel: string; reason: string } {
    if (this.suspiciousMerchants.has(merchantAddress.toLowerCase())) {
      return {
        isTrusted: false,
        riskLevel: 'high',
        reason: 'Merchant flagged in suspicious activity database'
      };
    }

    // Check if address is valid
    try {
      ethers.getAddress(merchantAddress);
    } catch {
      return {
        isTrusted: false,
        riskLevel: 'high',
        reason: 'Invalid merchant address format'
      };
    }

    return {
      isTrusted: true,
      riskLevel: 'low',
      reason: 'Merchant verification passed'
    };
  }

  /**
   * Analyze timing patterns for suspicious behavior
   */
  private analyzeTimingPatterns(receiptData: ReceiptData): { isSuspicious: boolean; reason: string } {
    const receiptTime = receiptData.timestamp;
    const now = Date.now();
    const ageInDays = (now - receiptTime) / (1000 * 60 * 60 * 24);

    // Check if receipt is from future
    if (receiptTime > now + 60000) { // 1 minute tolerance
      return {
        isSuspicious: true,
        reason: 'Receipt timestamp is in the future'
      };
    }

    // Check if receipt is too old
    if (ageInDays > 365) {
      return {
        isSuspicious: true,
        reason: 'Receipt is more than 1 year old'
      };
    }

    return {
      isSuspicious: false,
      reason: 'Timing verification passed'
    };
  }

  /**
   * Validate metadata consistency
   */
  private validateMetadata(receiptData: ReceiptData): { isConsistent: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check required fields
    if (!receiptData.device.type || !receiptData.device.brand || !receiptData.device.model) {
      issues.push('Missing required device information');
    }

    // Check price validity
    if (receiptData.amount <= 0 || receiptData.device.price <= 0) {
      issues.push('Invalid price values');
    }

    // Check address formats
    try {
      ethers.getAddress(receiptData.merchant);
      ethers.getAddress(receiptData.buyer);
    } catch {
      issues.push('Invalid Ethereum address format');
    }

    return {
      isConsistent: issues.length === 0,
      issues
    };
  }

  /**
   * Perform AI analysis using 0G Compute (mock for now)
   */
  private async performAIAnalysis(receiptData: ReceiptData | any): Promise<string> {
    // This would integrate with 0G Compute AI service
    // For now, return mock analysis
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const prompt = receiptData.prompt || `Analyze this receipt for potential fraud:
    Receipt ID: ${receiptData.receiptId}
    Merchant: ${receiptData.merchant}
    Device: ${receiptData.device?.brand} ${receiptData.device?.model}
    Price: ${receiptData.currency} ${receiptData.amount}
    
    Look for: price manipulation, duplicate patterns, suspicious timing, metadata inconsistencies.`;

    // In production, this would call:
    // const response = await zeroGAIService.sendMessage(prompt);
    // return response.text;

    // Mock response for development
    return `Analysis: Receipt appears genuine. Price is within reasonable market range. 
    No suspicious patterns detected. Device specifications match known models. 
    Timestamp is consistent. Recommendation: APPROVE with medium confidence.`;
  }

  /**
   * Calculate confidence score based on available data
   */
  private calculateConfidence(flags: FraudFlag[]): number {
    if (flags.length === 0) return 0.9;
    
    const criticalFlags = flags.filter(f => f.severity === 'critical').length;
    const highFlags = flags.filter(f => f.severity === 'high').length;
    
    if (criticalFlags > 0) return 0.95;
    if (highFlags > 1) return 0.85;
    if (highFlags === 1) return 0.75;
    return 0.6;
  }

  /**
   * Get recommendation based on risk score
   */
  private getRecommendation(riskScore: number, flags: FraudFlag[]): 'approve' | 'review' | 'reject' {
    const hasCritical = flags.some(f => f.severity === 'critical');
    
    if (hasCritical || riskScore >= 80) return 'reject';
    if (riskScore >= 50) return 'review';
    return 'approve';
  }

  /**
   * Initialize fraud patterns database
   */
  private initializeFraudPatterns(): FraudPattern[] {
    return [
      {
        name: 'duplicate_purchase',
        description: 'Same device purchased multiple times in short period',
        threshold: 2,
        timeWindow: 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      {
        name: 'price_inflation',
        description: 'Price significantly above market value',
        threshold: 50 // 50% above market
      },
      {
        name: 'rapid_succession',
        description: 'Multiple high-value purchases in rapid succession',
        threshold: 5,
        timeWindow: 60 * 60 * 1000 // 1 hour
      }
    ];
  }

  /**
   * Initialize price database with known device prices
   */
  private initializePriceDatabase(): void {
    // Sample price data (in USD)
    this.priceDatabase.set('apple_iphone 15 pro', 999);
    this.priceDatabase.set('apple_iphone 15', 799);
    this.priceDatabase.set('samsung_galaxy s24 ultra', 1199);
    this.priceDatabase.set('samsung_galaxy s24', 799);
    this.priceDatabase.set('google_pixel 8 pro', 999);
    this.priceDatabase.set('sony_playstation 5', 499);
    this.priceDatabase.set('microsoft_xbox series x', 499);
    this.priceDatabase.set('apple_macbook pro', 1999);
    this.priceDatabase.set('apple_macbook air', 1099);
    this.priceDatabase.set('dell_xps 13', 1299);
  }

  /**
   * Parse AI sustainability response
   */
  private parseSustainabilityResponse(aiResponse: string, deviceInfo: ReceiptData['device']): SustainabilityMetrics {
    try {
      // Attempt to parse JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          carbonFootprint: parsed.carbonFootprint || '5.0kg CO2eq',
          recyclabilityScore: parsed.recyclabilityScore || 70,
          ecoRating: parsed.ecoRating || 'B',
          expectedLifespan: parsed.expectedLifespan || '3-5 years',
          recyclingRecommendations: parsed.recyclingRecommendations || ['Take to certified e-waste facility'],
          sustainabilityFlags: parsed.sustainabilityFlags || []
        };
      }
    } catch (error) {
      console.warn('Failed to parse AI sustainability response:', error);
    }

    return this.getDefaultSustainabilityMetrics(deviceInfo);
  }

  /**
   * Get default sustainability metrics
   */
  private getDefaultSustainabilityMetrics(deviceInfo: ReceiptData['device']): SustainabilityMetrics {
    // Provide reasonable defaults based on device type
    const isElectronics = ['smartphone', 'laptop', 'tablet', 'computer'].includes(deviceInfo.type.toLowerCase());
    
    return {
      carbonFootprint: isElectronics ? '50kg CO2eq' : '10kg CO2eq',
      recyclabilityScore: isElectronics ? 75 : 60,
      ecoRating: 'B',
      expectedLifespan: isElectronics ? '3-5 years' : '5-7 years',
      recyclingRecommendations: [
        'Take to certified e-waste recycling facility',
        'Remove battery before recycling',
        'Check manufacturer take-back program'
      ],
      sustainabilityFlags: isElectronics ? ['Contains lithium battery', 'Contains rare earth metals'] : []
    };
  }

  /**
   * Add suspicious merchant to blocklist
   */
  addSuspiciousMerchant(address: string): void {
    this.suspiciousMerchants.add(address.toLowerCase());
  }

  /**
   * Remove merchant from blocklist
   */
  removeSuspiciousMerchant(address: string): void {
    this.suspiciousMerchants.delete(address.toLowerCase());
  }

  /**
   * Update price database
   */
  updatePrice(deviceKey: string, price: number): void {
    this.priceDatabase.set(deviceKey.toLowerCase(), price);
  }
}

interface FraudPattern {
  name: string;
  description: string;
  threshold: number;
  timeWindow?: number;
}

// Singleton instance
export const fraudDetectionService = new FraudDetectionService();

