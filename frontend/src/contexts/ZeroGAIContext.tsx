import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { zeroGAIService, ZeroGAIResponse, ServiceProvider } from '../services/ZeroGAIService';

interface ZeroGAIContextType {
  isInitialized: boolean;
  isLoading: boolean;
  balance: { balance: string; locked: string; available: string } | null;
  services: ServiceProvider[];
  error: string | null;
  
  // Actions
  initializeService: (privateKey: string) => Promise<void>;
  sendMessage: (message: string, providerAddress?: string, model?: string) => Promise<ZeroGAIResponse>;
  addFunds: (amount: string) => Promise<void>;
  retrieveFunds: (amount: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshServices: () => Promise<void>;
  clearError: () => void;
}

const ZeroGAIContext = createContext<ZeroGAIContextType | undefined>(undefined);

interface ZeroGAIProviderProps {
  children: ReactNode;
}

export const ZeroGAIProvider: React.FC<ZeroGAIProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<{ balance: string; locked: string; available: string } | null>(null);
  const [services, setServices] = useState<ServiceProvider[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const initializeService = async (privateKey: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await zeroGAIService.initialize(privateKey);
      setIsInitialized(true);
      
      // Load initial data
      await Promise.all([
        refreshBalance(),
        refreshServices()
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize 0G AI service';
      setError(errorMessage);
      console.error('0G AI initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (
    message: string, 
    providerAddress?: string, 
    model?: string
  ): Promise<ZeroGAIResponse> => {
    if (!isInitialized) {
      throw new Error('0G AI service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await zeroGAIService.sendMessage(message, providerAddress, model);
      
      // Refresh balance after sending message (as it costs tokens)
      await refreshBalance();
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addFunds = async (amount: string) => {
    if (!isInitialized) {
      throw new Error('0G AI service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await zeroGAIService.addFunds(amount);
      await refreshBalance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add funds';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const retrieveFunds = async (amount: string) => {
    if (!isInitialized) {
      throw new Error('0G AI service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await zeroGAIService.retrieveFunds(amount);
      await refreshBalance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve funds';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!isInitialized) return;

    try {
      const balanceData = await zeroGAIService.getBalance();
      setBalance(balanceData);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
      // Don't set error state for balance refresh failures
    }
  };

  const refreshServices = async () => {
    if (!isInitialized) return;

    try {
      const servicesData = await zeroGAIService.discoverServices();
      setServices(servicesData);
    } catch (err) {
      console.error('Failed to refresh services:', err);
      // Don't set error state for service refresh failures
    }
  };

  // Check if service is already initialized on mount
  useEffect(() => {
    if (zeroGAIService.isServiceInitialized()) {
      setIsInitialized(true);
      refreshBalance();
      refreshServices();
    }
  }, []);

  const contextValue: ZeroGAIContextType = {
    isInitialized,
    isLoading,
    balance,
    services,
    error,
    initializeService,
    sendMessage,
    addFunds,
    retrieveFunds,
    refreshBalance,
    refreshServices,
    clearError
  };

  return (
    <ZeroGAIContext.Provider value={contextValue}>
      {children}
    </ZeroGAIContext.Provider>
  );
};

export const useZeroGAI = (): ZeroGAIContextType => {
  const context = useContext(ZeroGAIContext);
  if (!context) {
    throw new Error('useZeroGAI must be used within a ZeroGAIProvider');
  }
  return context;
};