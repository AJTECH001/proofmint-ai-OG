import { useState, useCallback } from 'react';
import { useZeroGAI } from '../contexts/ZeroGAIContext';
import { ProofMintAI, AIResponse } from '../utils/proofmintAI';

export interface EnhancedAIResponse extends AIResponse {
  source: 'local' | '0g-ai';
  model?: string;
  provider?: string;
  verified?: boolean;
  cost?: string;
}

interface UseZeroGProofMintAIOptions {
  fallbackToLocal?: boolean;
  preferredProvider?: string;
  preferredModel?: string;
}

export const useZeroGProofMintAI = (options: UseZeroGProofMintAIOptions = {}) => {
  const { 
    isInitialized, 
    isLoading: zeroGLoading, 
    sendMessage: sendZeroGMessage,
    error: zeroGError,
    clearError
  } = useZeroGAI();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<EnhancedAIResponse | null>(null);

  const { 
    fallbackToLocal = true, 
    preferredProvider, 
    preferredModel 
  } = options;

  const sendMessage = useCallback(async (query: string): Promise<EnhancedAIResponse> => {
    setIsProcessing(true);
    clearError();

    try {
      // Try 0G AI first if initialized
      if (isInitialized && !zeroGLoading) {
        try {
          const zeroGResponse = await sendZeroGMessage(
            `You are ProofMint AI, an expert assistant for blockchain-powered electronics ownership and NFT receipts. 
            
Context: ProofMint is a platform that creates NFT receipts for electronics purchases, enabling:
- Digital proof of ownership through blockchain
- Seamless ownership transfers when selling devices  
- Warranty tracking and verification
- Sustainable e-waste recycling programs
- Green credits for responsible recycling

Please provide helpful, accurate information about ProofMint's features and blockchain technology for electronics ownership.

User question: ${query}`,
            preferredProvider,
            preferredModel
          );

          const enhancedResponse: EnhancedAIResponse = {
            text: zeroGResponse.text,
            category: categorizeResponse(query),
            source: '0g-ai',
            model: zeroGResponse.model,
            provider: zeroGResponse.provider,
            verified: zeroGResponse.verified
          };

          setLastResponse(enhancedResponse);
          return enhancedResponse;

        } catch (zeroGError) {
          console.warn('0G AI failed, using fallback:', zeroGError);
          
          if (!fallbackToLocal) {
            throw zeroGError;
          }
          // Fall through to local AI
        }
      }

      // Use local ProofMint AI as fallback or primary
      const localResponse = await ProofMintAI.getResponse(query);
      const enhancedResponse: EnhancedAIResponse = {
        ...localResponse,
        source: 'local'
      };

      setLastResponse(enhancedResponse);
      return enhancedResponse;

    } catch (error) {
      console.error('AI response failed:', error);
      
      // Return error response in expected format
      const errorResponse: EnhancedAIResponse = {
        text: `I'm sorry, I'm having trouble processing your request right now. ${
          isInitialized 
            ? 'Please try again in a moment or check your account balance for 0G AI services.' 
            : 'The enhanced AI features require setup. You can still browse ProofMint features in your dashboard.'
        }`,
        category: 'general',
        source: 'local'
      };
      
      setLastResponse(errorResponse);
      return errorResponse;

    } finally {
      setIsProcessing(false);
    }
  }, [
    isInitialized, 
    zeroGLoading, 
    sendZeroGMessage, 
    fallbackToLocal, 
    preferredProvider, 
    preferredModel,
    clearError
  ]);

  const getCapabilities = useCallback(() => {
    return {
      hasZeroGAI: isInitialized,
      hasLocalAI: true,
      isEnhanced: isInitialized,
      currentSource: lastResponse?.source || (isInitialized ? '0g-ai' : 'local')
    };
  }, [isInitialized, lastResponse]);

  return {
    sendMessage,
    isProcessing: isProcessing || zeroGLoading,
    lastResponse,
    error: zeroGError,
    clearError,
    capabilities: getCapabilities(),
    isZeroGInitialized: isInitialized
  };
};

// Helper function to categorize responses for consistency with existing system
function categorizeResponse(query: string): AIResponse['category'] {
  const lowerQuery = query.toLowerCase();
  
  if (matchesKeywords(lowerQuery, ['nft', 'receipt', 'digital receipt', 'proof of purchase', 'certificate'])) {
    return 'nft';
  }
  
  if (matchesKeywords(lowerQuery, ['blockchain', 'crypto', 'decentralized', 'distributed', 'immutable', 'smart contract'])) {
    return 'blockchain';
  }
  
  if (matchesKeywords(lowerQuery, ['recycle', 'recycling', 'e-waste', 'environment', 'green', 'sustainable', 'disposal'])) {
    return 'recycling';
  }
  
  if (matchesKeywords(lowerQuery, ['ownership', 'transfer', 'sell', 'selling', 'resale', 'gift', 'owner', 'warranty'])) {
    return 'ownership';
  }
  
  return 'general';
}

function matchesKeywords(query: string, keywords: string[]): boolean {
  return keywords.some(keyword => query.includes(keyword));
}