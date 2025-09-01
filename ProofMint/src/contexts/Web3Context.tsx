import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

type Web3ContextType = {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.providers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
};

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);

        const checkConnection = async () => {
          try {
            const accounts = await web3Provider.listAccounts();
            if (accounts.length > 0) {
              const signer = web3Provider.getSigner();
              const network = await web3Provider.getNetwork();
              setSigner(signer);
              setAccount(accounts[0]);
              setChainId(network.chainId.toNumber());
            }
          } catch (err) {
            console.error('Error checking connection:', err);
            setError('Failed to initialize Web3 provider');
          }
        };

        checkConnection();

        const handleAccountsChanged = async (accounts: string[]) => {
          if (accounts.length === 0) {
            setAccount(null);
            setSigner(null);
          } else {
            setAccount(accounts[0]);
            const newSigner = web3Provider.getSigner();
            setSigner(newSigner);
          }
        };

        const handleChainChanged = () => {
          window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
          if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      } catch (err) {
        console.error('Error initializing Web3:', err);
        setError('Failed to initialize Web3 provider');
      }
    } else {
      setError('Please install MetaMask or another Web3 provider');
    }
  }, []);

  const connect = async () => {
    if (!provider) {
      setError('Web3 provider not available');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setSigner(signer);
      setChainId(network.chainId.toNumber());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Web3 provider');
      console.error('Connection error:', err);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setChainId(null);
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        isConnected: !!account,
        connect,
        disconnect,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};