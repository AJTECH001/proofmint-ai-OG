// src/components/WalletConnect.tsx
import React, { useState } from "react";

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}
import { ethers } from "ethers";
import { checkRole } from "../utils/contract";
import { Role } from "../utils/types";

interface WalletConnectProps {
  setAccount: (account: string) => void;
  setRole: (role: Role) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  setAccount,
  setRole,
}) => {
  const [error, setError] = useState<string>("");

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      const userRole = await checkRole(address);
      setRole(userRole);
      setError("");
    } catch (err) {
      setError("Failed to connect wallet: " + (err as Error).message);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={connectWallet}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Connect Wallet now
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default WalletConnect;
