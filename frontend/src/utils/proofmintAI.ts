export interface AIResponse {
  text: string;
  category: 'nft' | 'blockchain' | 'recycling' | 'ownership' | 'general';
}

export class ProofMintAI {
  private static readonly responses = {
    nft: [
      'NFT receipts on ProofMint serve as digital proof of ownership for your electronics. Each purchase generates a unique NFT that contains device details, purchase date, and ownership history. This creates an immutable record on the blockchain that can\'t be forged or duplicated.',
      'Your NFT receipt includes device specifications, warranty information, purchase location, and a complete ownership chain. You can view all your NFT receipts in your <a href="/dashboard" class="text-blue-500 underline">dashboard</a> and transfer them when selling your device.',
      'NFT receipts make reselling easier by providing verified proof of authenticity and ownership history. Buyers can trust the device\'s provenance, and you can command higher resale values with verified ownership documentation.'
    ],
    blockchain: [
      'ProofMint uses blockchain technology to create tamper-proof records of electronics ownership. Every transaction is recorded on a distributed ledger, ensuring your ownership rights are permanently secured and verifiable by anyone.',
      'Our blockchain integration with Stellar provides fast, low-cost transactions while maintaining security. Your device ownership data is encrypted and distributed across multiple nodes, making it virtually impossible to hack or manipulate.',
      'Blockchain technology enables seamless ownership transfers when you sell or gift your electronics. The smart contracts automatically update ownership records and transfer NFT receipts to the new owner.'
    ],
    recycling: [
      'ProofMint tracks your device\'s complete lifecycle from purchase to recycling. When you\'re ready to recycle, we connect you with certified e-waste centers and update your NFT to reflect the device\'s end-of-life status.',
      'Responsible recycling through ProofMint earns you green credits that can be used for discounts on future purchases. We partner with certified recyclers who follow environmental standards and provide recycling certificates.',
      'Track your environmental impact through your <a href="/dashboard" class="text-blue-500 underline">dashboard</a>. See how many devices you\'ve recycled, carbon footprint reduced, and green credits earned through responsible e-waste management.'
    ],
    ownership: [
      'Digital ownership on ProofMint means you have cryptographic proof of your electronics ownership that\'s recognized globally. Your ownership rights are secured by blockchain technology and can\'t be disputed or forged.',
      'Transfer ownership instantly when selling your device. The blockchain automatically updates ownership records, transfers warranty information, and provides the new owner with complete device history and documentation.',
      'Prove ownership for insurance claims, warranty services, or resale with your NFT receipt. The blockchain record includes purchase details, device specifications, and complete ownership chain that satisfies legal and commercial requirements.'
    ],
    warranty: [
      'Your NFT receipt includes warranty information that\'s automatically verified with manufacturers. No more lost warranty cards - your blockchain record serves as permanent warranty proof that can\'t be lost or damaged.',
      'Extended warranties and service plans are linked to your NFT, making warranty claims seamless. Service providers can instantly verify your coverage and device history through the blockchain record.',
      'Transfer warranties to new owners when selling your device. The blockchain automatically updates warranty coverage and notifies the manufacturer of the ownership change.'
    ],
    security: [
      'ProofMint uses military-grade encryption to protect your data. Your personal information is never stored on the blockchain - only device ownership records and transaction hashes are publicly visible.',
      'Multi-factor authentication and biometric verification protect your account. Your private keys are secured using hardware security modules and never transmitted over the internet.',
      'Smart contracts automatically execute ownership transfers and warranty updates without human intervention, eliminating the risk of fraud or manipulation in the ownership transfer process.'
    ]
  };

  static async getResponse(query: string): Promise<AIResponse> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const lowerQuery = query.toLowerCase();
    
    // NFT and Receipt related queries
    if (this.matchesKeywords(lowerQuery, ['nft', 'receipt', 'digital receipt', 'proof of purchase', 'certificate'])) {
      return {
        text: this.getRandomResponse('nft'),
        category: 'nft'
      };
    }
    
    // Blockchain related queries
    if (this.matchesKeywords(lowerQuery, ['blockchain', 'crypto', 'decentralized', 'distributed', 'immutable', 'smart contract'])) {
      return {
        text: this.getRandomResponse('blockchain'),
        category: 'blockchain'
      };
    }
    
    // Recycling and sustainability queries
    if (this.matchesKeywords(lowerQuery, ['recycle', 'recycling', 'e-waste', 'environment', 'green', 'sustainable', 'disposal'])) {
      return {
        text: this.getRandomResponse('recycling'),
        category: 'recycling'
      };
    }
    
    // Ownership and transfer queries
    if (this.matchesKeywords(lowerQuery, ['ownership', 'transfer', 'sell', 'selling', 'resale', 'gift', 'owner'])) {
      return {
        text: this.getRandomResponse('ownership'),
        category: 'ownership'
      };
    }
    
    // Warranty related queries
    if (this.matchesKeywords(lowerQuery, ['warranty', 'guarantee', 'service', 'repair', 'claim', 'coverage'])) {
      return {
        text: this.getRandomResponse('warranty'),
        category: 'ownership'
      };
    }
    
    // Security related queries
    if (this.matchesKeywords(lowerQuery, ['security', 'safe', 'secure', 'privacy', 'protection', 'hack', 'fraud'])) {
      return {
        text: this.getRandomResponse('security'),
        category: 'blockchain'
      };
    }
    
    // General ProofMint queries
    return {
      text: `I'm ProofMint AI, specialized in blockchain-powered electronics ownership! I can help you with:

🔗 **NFT Receipts** - Digital proof of ownership
⛓️ **Blockchain Security** - Tamper-proof records  
♻️ **Recycling Tracking** - Sustainable e-waste management
📱 **Ownership Transfers** - Seamless device reselling
🛡️ **Warranty Management** - Digital warranty protection

Try asking: "How do NFT receipts work?" or "How to transfer ownership?" or visit our <a href="/dashboard" class="text-blue-500 underline">dashboard</a> to get started!`,
      category: 'general'
    };
  }

  private static matchesKeywords(query: string, keywords: string[]): boolean {
    return keywords.some(keyword => query.includes(keyword));
  }

  private static getRandomResponse(category: keyof typeof ProofMintAI.responses): string {
    const responses = this.responses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}