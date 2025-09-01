import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers"; // Updated import

export function useWeb3() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [web3Error, setWeb3Error] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          setIsConnected(true);
          setWeb3Error(null);
        } else {
          setWeb3Error("No accounts found. Please unlock MetaMask.");
        }
      } catch (error: any) {
        setWeb3Error(error.message || "Failed to connect to wallet.");
        console.error("Wallet connection error:", error);
      }
    } else {
      setWeb3Error("Please install MetaMask or another Web3 wallet.");
    }
  }, []);

  useEffect(() => {
    connect();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        setAccount(accounts[0] || null);
        setIsConnected(!!accounts[0]);
        setWeb3Error(null);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", connect);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", connect);
      };
    }
  }, [connect]);

  return { connect, account, isConnected, web3Error };
}